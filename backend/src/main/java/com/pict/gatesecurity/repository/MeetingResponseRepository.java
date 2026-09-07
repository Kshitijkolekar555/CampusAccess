package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.MeetingResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MeetingResponseRepository extends JpaRepository<MeetingResponse, Long> {

    List<MeetingResponse> findByMeetingRequestIdOrderByRespondedAtDesc(Long meetingRequestId);

    Optional<MeetingResponse> findFirstByMeetingRequestIdOrderByRespondedAtDesc(Long meetingRequestId);
}
