package com.shopcloud.plan.repository;

import com.shopcloud.plan.entity.Plan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlanRepository
        extends JpaRepository<Plan, Long> {

    List<Plan> findByActivoTrue();

    Optional<Plan> findByIdAndActivoTrue(
            Long id
    );

    Optional<Plan> findByNombreIgnoreCase(
            String nombre
    );
}