package com.tour.pojo.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** 对话记录里的一条消息 */
@Data
public class ChatMessageDTO {

    @NotNull
    @Pattern(regexp = "user|assistant", message = "消息角色只能是 user 或 assistant")
    private String role;

    @NotNull
    @Size(max = 2000, message = "消息太长")
    private String content;
}
