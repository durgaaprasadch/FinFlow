package com.finflow.auth.repository;

import com.finflow.auth.entity.UserLogin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface UserLoginRepository extends JpaRepository<UserLogin, Long> {
    List<UserLogin> findTop3ByUserIdOrderByLoginTimeDesc(UUID userId);
}
