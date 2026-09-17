package com.tour.pojo.entity;

import lombok.Data;

import java.time.LocalDateTime;

/** 游客账号（sys_user） */
@Data
public class User {

    private Long id;
    private String username;
    private String password;
    private String nickname;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
