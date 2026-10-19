package com.pict.gatesecurity.service.impl;

import com.pict.gatesecurity.dto.visitor.FaceRecognitionResponse;
import com.pict.gatesecurity.service.FaceRecognitionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class FaceRecognitionServiceImpl implements FaceRecognitionService {

    @Value("${face.service.url:http://localhost:8001}")
    private String faceServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public FaceRecognitionResponse recognize(MultipartFile photo) {
        File tempFile = null;
        try {
            tempFile = convertMultipartToFile(photo);
            return recognize(tempFile);
        } catch (IOException e) {
            log.error("Failed to process multipart photo for recognition", e);
            return FaceRecognitionResponse.builder().matched(false).distance(1.0).build();
        } finally {
            if (tempFile != null && tempFile.exists()) {
                tempFile.delete();
            }
        }
    }

    @Override
    public FaceRecognitionResponse recognize(File photoFile) {
        try {
            String url = faceServiceUrl + "/recognize";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new FileSystemResource(photoFile));

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, requestEntity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> resMap = response.getBody();
                Boolean matched = Boolean.TRUE.equals(resMap.get("matched"));
                String faceId = (String) resMap.get("faceId");
                Number distance = (Number) resMap.get("distance");
                Number similarity = (Number) resMap.get("similarity");
                Number numFaces = (Number) resMap.get("numFaces");
                Boolean isAmbiguous = Boolean.TRUE.equals(resMap.get("isAmbiguous"));
                String message = (String) resMap.get("message");
                String matchType = (String) resMap.get("matchType");
                Map<String, Object> quality = (Map<String, Object>) resMap.get("quality");

                log.info("Face recognition service response: matched={}, faceId={}, distance={}, similarity={}, matchType={}", matched, faceId, distance, similarity, matchType);
                return FaceRecognitionResponse.builder()
                        .matched(matched)
                        .faceId(faceId)
                        .distance(distance != null ? distance.doubleValue() : 1.0)
                        .similarity(similarity != null ? similarity.doubleValue() : 0.0)
                        .numFaces(numFaces != null ? numFaces.intValue() : 0)
                        .isAmbiguous(isAmbiguous)
                        .matchType(matchType)
                        .message(message)
                        .quality(quality)
                        .build();
            }
        } catch (Exception e) {
            log.error("Error communicating with Face Recognition service at {}: {}", faceServiceUrl, e.getMessage());
        }

        return FaceRecognitionResponse.builder()
                .matched(false)
                .distance(1.0)
                .similarity(0.0)
                .message("Face recognition microservice is currently unreachable")
                .build();
    }

    @Override
    public String enroll(MultipartFile photo) {
        File tempFile = null;
        try {
            tempFile = convertMultipartToFile(photo);
            return enroll(tempFile);
        } catch (IOException e) {
            log.error("Failed to process multipart photo for enrollment", e);
            return null;
        } finally {
            if (tempFile != null && tempFile.exists()) {
                tempFile.delete();
            }
        }
    }

    @Override
    public String enroll(File photoFile) {
        try {
            String url = faceServiceUrl + "/enroll";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new FileSystemResource(photoFile));

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, requestEntity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> resMap = response.getBody();
                String faceId = (String) resMap.get("faceId");
                log.info("Face enrollment service response: faceId={}", faceId);
                return faceId;
            }
        } catch (Exception e) {
            log.error("Error communicating with Face Recognition service enrollment at {}: {}", faceServiceUrl, e.getMessage());
        }

        return null;
    }

    private File convertMultipartToFile(MultipartFile file) throws IOException {
        File convFile = File.createTempFile("visitor_temp_", ".jpg");
        try (FileOutputStream fos = new FileOutputStream(convFile)) {
            fos.write(file.getBytes());
        }
        return convFile;
    }

    @Override
    public boolean deleteEmbedding(String faceId) {
        if (faceId == null || faceId.isBlank()) {
            return false;
        }
        try {
            String url = faceServiceUrl + "/embedding/" + faceId;
            restTemplate.delete(url);
            log.info("Face embedding deleted for faceId={}", faceId);
            return true;
        } catch (Exception e) {
            log.warn("Could not delete face embedding for faceId={}: {}", faceId, e.getMessage());
            return false;
        }
    }
}
