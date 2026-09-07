package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.VisitorMeetingRequest;
import com.pict.gatesecurity.entity.enums.MeetingRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VisitorMeetingRequestRepository extends JpaRepository<VisitorMeetingRequest, Long>, JpaSpecificationExecutor<VisitorMeetingRequest> {

    List<VisitorMeetingRequest> findByVisitorIdAndDeletedAtIsNullOrderByRequestTimeDesc(Long visitorId);

    Page<VisitorMeetingRequest> findByFacultyIdAndStatusAndDeletedAtIsNullOrderByRequestTimeDesc(
            Long facultyId, MeetingRequestStatus status, Pageable pageable);

    Page<VisitorMeetingRequest> findByFacultyIdAndDeletedAtIsNullOrderByRequestTimeDesc(
            Long facultyId, Pageable pageable);

    Page<VisitorMeetingRequest> findByGateIdAndDeletedAtIsNullOrderByRequestTimeDesc(
            Long gateId, Pageable pageable);

    Page<VisitorMeetingRequest> findAllByDeletedAtIsNullOrderByRequestTimeDesc(Pageable pageable);

    @Query("SELECT vmr FROM VisitorMeetingRequest vmr " +
           "JOIN vmr.visitor v " +
           "WHERE v.mobile = :mobile AND vmr.deletedAt IS NULL " +
           "ORDER BY vmr.requestTime DESC")
    List<VisitorMeetingRequest> findByVisitorMobile(@Param("mobile") String mobile);

    long countByFacultyIdAndStatusAndDeletedAtIsNull(Long facultyId, MeetingRequestStatus status);
}
