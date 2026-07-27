package com.pict.gatesecurity.util;

import com.pict.gatesecurity.dto.report.ReportFilterRequest;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

public final class ReportSpecifications {

    private ReportSpecifications() {
    }

    public static OffsetDateTime toStartOfDay(LocalDate date) {
        if (date == null) return null;
        return date.atStartOfDay().atOffset(java.time.ZoneOffset.of("+05:30"));
    }

    public static OffsetDateTime toEndOfDay(LocalDate date) {
        if (date == null) return null;
        return date.atTime(23, 59, 59).atOffset(java.time.ZoneOffset.of("+05:30"));
    }

    public static <T> List<Predicate> buildCommonPredicates(
            Root<T> root,
            CriteriaBuilder cb,
            ReportFilterRequest filter,
            java.util.function.BiFunction<Root<T>, String, Boolean> hasField) {

        List<Predicate> predicates = new ArrayList<>();

        if (filter.getFromDate() != null && hasField.apply(root, "createdAt")) {
            predicates.add(cb.greaterThanOrEqualTo(
                    root.get("createdAt"), toStartOfDay(filter.getFromDate())));
        }
        if (filter.getToDate() != null && hasField.apply(root, "createdAt")) {
            predicates.add(cb.lessThanOrEqualTo(
                    root.get("createdAt"), toEndOfDay(filter.getToDate())));
        }

        return predicates;
    }

    public static <T> void addDateRangePredicate(
            List<Predicate> predicates,
            Root<T> root,
            CriteriaBuilder cb,
            ReportFilterRequest filter,
            String dateField) {

        if (filter.getFromDate() != null) {
            predicates.add(cb.greaterThanOrEqualTo(
                    root.get(dateField), toStartOfDay(filter.getFromDate())));
        }
        if (filter.getToDate() != null) {
            predicates.add(cb.lessThanOrEqualTo(
                    root.get(dateField), toEndOfDay(filter.getToDate())));
        }
    }

    public static <T> void addGatePredicate(
            List<Predicate> predicates,
            Root<T> root,
            CriteriaBuilder cb,
            ReportFilterRequest filter) {

        if (filter.getGateId() != null) {
            predicates.add(cb.equal(root.get("gate").get("id"), filter.getGateId()));
        }
    }

    public static <T> void addSearchPredicate(
            List<Predicate> predicates,
            Root<T> root,
            CriteriaBuilder cb,
            ReportFilterRequest filter,
            String... searchFields) {

        if (StringUtils.hasText(filter.getSearch()) && searchFields.length > 0) {
            String pattern = "%" + filter.getSearch().toLowerCase() + "%";
            Predicate[] orPredicates = new Predicate[searchFields.length];
            for (int i = 0; i < searchFields.length; i++) {
                orPredicates[i] = cb.like(cb.lower(root.get(searchFields[i])), pattern);
            }
            predicates.add(cb.or(orPredicates));
        }
    }
}
