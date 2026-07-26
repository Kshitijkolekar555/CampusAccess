package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.Gate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GateRepository extends JpaRepository<Gate, Long> {

    List<Gate> findByActiveTrue();
}
