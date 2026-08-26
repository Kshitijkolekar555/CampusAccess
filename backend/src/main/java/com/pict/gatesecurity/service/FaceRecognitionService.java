package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.visitor.FaceRecognitionResponse;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;

public interface FaceRecognitionService {
    FaceRecognitionResponse recognize(MultipartFile photo);
    FaceRecognitionResponse recognize(File photoFile);
    String enroll(MultipartFile photo);
    String enroll(File photoFile);
}
