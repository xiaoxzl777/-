package com.tour.controller.user;

import com.tour.common.Result;
import com.tour.common.UserContext;
import com.tour.pojo.dto.ChatDTO;
import com.tour.pojo.dto.PlanDTO;
import com.tour.pojo.vo.ChatReplyVO;
import com.tour.pojo.vo.GreetingVO;
import com.tour.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 用户端：和小萧对话 */
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    /** 打开小萧页面时的主动问候 */
    @GetMapping("/chat/greeting")
    public Result<GreetingVO> greeting() {
        return Result.ok(chatService.greeting(UserContext.getUserId()));
    }

    /** 发消息：小萧先识别意图，闲聊就回复，规划就排行程 */
    @PostMapping("/chat")
    public Result<ChatReplyVO> chat(@RequestBody @Valid ChatDTO dto) {
        return Result.ok(chatService.chat(dto));
    }

    /** 改了条件标签或删站后按条件重排 */
    @PostMapping("/plan")
    public Result<ChatReplyVO> plan(@RequestBody @Valid PlanDTO dto) {
        return Result.ok(chatService.plan(dto));
    }
}
