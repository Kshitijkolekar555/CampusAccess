package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.visitor.FaceRecognitionResponse;
import com.pict.gatesecurity.dto.visitor.VisitorCheckInRequest;
import com.pict.gatesecurity.dto.visitor.VisitorRecognitionResponse;
import com.pict.gatesecurity.dto.visitor.VisitorResponse;
import com.pict.gatesecurity.entity.Gate;
import com.pict.gatesecurity.entity.User;
import com.pict.gatesecurity.entity.Visitor;
import com.pict.gatesecurity.entity.enums.HostDepartment;
import com.pict.gatesecurity.entity.enums.HostType;
import com.pict.gatesecurity.entity.enums.UserRole;
import com.pict.gatesecurity.exception.BadRequestException;
import com.pict.gatesecurity.mapper.VisitorMapper;
import com.pict.gatesecurity.repository.GateRepository;
import com.pict.gatesecurity.repository.NotificationRepository;
import com.pict.gatesecurity.repository.UserRepository;
import com.pict.gatesecurity.repository.VisitorRepository;
import com.pict.gatesecurity.repository.WatchlistRepository;
import com.pict.gatesecurity.service.impl.VisitorServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VisitorServiceImplTest {

    @Mock private VisitorRepository visitorRepository;
    @Mock private GateRepository gateRepository;
    @Mock private UserRepository userRepository;
    @Mock private WatchlistRepository watchlistRepository;
    @Mock private VisitorMapper visitorMapper;
    @Mock private AuditLogService auditLogService;
    @Mock private FaceRecognitionService faceRecognitionService;
    @Mock private NotificationRepository notificationRepository;
    @Mock private com.pict.gatesecurity.repository.AuthorizedFacultyRepository authorizedFacultyRepository;

    private VisitorServiceImpl visitorService;

    private User testUser;
    private Gate testGate;
    private Visitor testVisitor;

    @BeforeEach
    void setUp() {
        visitorService = new VisitorServiceImpl(
                visitorRepository, gateRepository, userRepository,
                watchlistRepository, visitorMapper, auditLogService,
                faceRecognitionService, notificationRepository, authorizedFacultyRepository
        );

        testUser = User.builder().id(1L).username("guard1").fullName("Guard").role(UserRole.SECURITY_OFFICER).active(true).build();
        testGate = Gate.builder().id(1L).name("Main Gate").active(true).build();
        testVisitor = Visitor.builder()
                .id(100L)
                .name("Ramesh Patil")
                .mobile("9876543210")
                .purpose("Meeting Principal")
                .hostName("Dr. Sharma")
                .hostType(HostType.FACULTY)
                .hostDepartment(HostDepartment.CE)
                .gate(testGate)
                .timeIn(OffsetDateTime.now().minusHours(2))
                .faceId("face-uuid-1234")
                .photoPath("/uploads/visitor-photos/visitor_1.jpg")
                .createdBy(testUser)
                .build();
    }

    @Test
    void recognizeVisitorFace_nullPhoto_throwsBadRequestException() {
        assertThrows(BadRequestException.class, () -> visitorService.recognizeVisitorFace(null));
    }

    @Test
    void recognizeVisitorFace_emptyPhoto_throwsBadRequestException() {
        MockMultipartFile emptyFile = new MockMultipartFile("photo", "empty.jpg", "image/jpeg", new byte[0]);
        assertThrows(BadRequestException.class, () -> visitorService.recognizeVisitorFace(emptyFile));
    }

    @Test
    void recognizeVisitorFace_matchedSubjectFound_returnsEnrichedDetails() {
        MockMultipartFile photo = new MockMultipartFile("photo", "face.jpg", "image/jpeg", new byte[]{1, 2, 3});

        FaceRecognitionResponse faceResponse = FaceRecognitionResponse.builder()
                .matched(true)
                .faceId("face-uuid-1234")
                .distance(0.18)
                .similarity(82.0)
                .numFaces(1)
                .isAmbiguous(false)
                .quality(Map.of("suitable", true, "blur_score", 150.0))
                .build();

        when(faceRecognitionService.recognize(photo)).thenReturn(faceResponse);
        when(visitorRepository.findFirstByFaceIdOrderByTimeInDesc("face-uuid-1234"))
                .thenReturn(Optional.of(testVisitor));

        VisitorRecognitionResponse response = visitorService.recognizeVisitorFace(photo);

        assertNotNull(response);
        assertTrue(response.getMatched());
        assertEquals(100L, response.getVisitorId());
        assertEquals("Ramesh Patil", response.getVisitorName());
        assertEquals("9876543210", response.getMobileNumber());
        assertEquals("Dr. Sharma", response.getHostName());
        assertEquals(HostDepartment.CE, response.getHostDepartment());
        assertEquals(0.18, response.getConfidenceDistance());
        assertEquals(82.0, response.getSimilarity());
        assertFalse(response.getIsAmbiguous());
        assertEquals(1, response.getNumFaces());
    }

    @Test
    void recognizeVisitorFace_unmatched_returnsMatchedFalseWithDiagnostics() {
        MockMultipartFile photo = new MockMultipartFile("photo", "face.jpg", "image/jpeg", new byte[]{1, 2, 3});

        FaceRecognitionResponse faceResponse = FaceRecognitionResponse.builder()
                .matched(false)
                .faceId(null)
                .distance(0.85)
                .similarity(15.0)
                .numFaces(1)
                .isAmbiguous(false)
                .quality(Map.of("suitable", true, "blur_score", 120.0))
                .build();

        when(faceRecognitionService.recognize(photo)).thenReturn(faceResponse);

        VisitorRecognitionResponse response = visitorService.recognizeVisitorFace(photo);

        assertNotNull(response);
        assertFalse(response.getMatched());
        assertNull(response.getVisitorId());
        assertEquals(0.85, response.getConfidenceDistance());
        assertEquals(1, response.getNumFaces());
    }

    @Test
    void recognizeVisitorFace_qualityIssueReported_propagatesInResponse() {
        MockMultipartFile photo = new MockMultipartFile("photo", "blurry.jpg", "image/jpeg", new byte[]{1, 2, 3});

        FaceRecognitionResponse faceResponse = FaceRecognitionResponse.builder()
                .matched(false)
                .numFaces(1)
                .quality(Map.of("suitable", false, "issues", java.util.List.of("Image is too blurry")))
                .message("Image quality insufficient")
                .build();

        when(faceRecognitionService.recognize(photo)).thenReturn(faceResponse);

        VisitorRecognitionResponse response = visitorService.recognizeVisitorFace(photo);

        assertNotNull(response);
        assertFalse(response.getMatched());
        assertEquals("Image quality insufficient", response.getMessage());
        assertNotNull(response.getQuality());
        assertFalse((Boolean) response.getQuality().get("suitable"));
    }
}
