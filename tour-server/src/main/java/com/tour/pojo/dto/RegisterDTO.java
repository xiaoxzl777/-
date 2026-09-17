package com.tour.pojo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterDTO {

    @NotBlank(message = "请输入用户名")
    @Pattern(regexp = "^\\w{3,20}$", message = "用户名为 3 到 20 位字母、数字或下划线")
    private String username;

    @NotBlank(message = "请输入密码")
    @Size(min = 6, max = 20, message = "密码为 6 到 20 位")
    private String password;

    @Size(max = 12, message = "昵称最多 12 个字")
    private String nickname;
}
