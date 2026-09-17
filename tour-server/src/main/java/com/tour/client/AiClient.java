package com.tour.client;

import com.tour.common.BusinessException;
import com.tour.common.ErrorCode;
import com.tour.pojo.ai.AiChatRequest;
import com.tour.pojo.ai.AiPlanRequest;
import com.tour.pojo.vo.ChatReplyVO;
import com.tour.pojo.vo.GreetingVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.function.Supplier;

/**
 * 调用 Python AI 服务（小萧）。接口说明见接口文档第 8 节。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AiClient {

    private final RestClient aiRestClient;

    public GreetingVO greeting(String nickname) {
        return call(() -> aiRestClient.get()
                .uri(builder -> builder.path("/greeting").queryParam("nickname", nickname).build())
                .retrieve()
                .body(GreetingVO.class));
    }

    public ChatReplyVO chat(AiChatRequest request) {
        return call(() -> aiRestClient.post().uri("/chat").body(request).retrieve().body(ChatReplyVO.class));
    }

    public ChatReplyVO plan(AiPlanRequest request) {
        return call(() -> aiRestClient.post().uri("/plan").body(request).retrieve().body(ChatReplyVO.class));
    }

    private <T> T call(Supplier<T> request) {
        try {
            T result = request.get();
            if (result == null) {
                throw new BusinessException(ErrorCode.AI_UNAVAILABLE, "小萧没有回应，请稍后再试");
            }
            return result;
        } catch (ResourceAccessException e) {
            log.warn("连不上 AI 服务：{}", e.getMessage());
            throw new BusinessException(ErrorCode.AI_UNAVAILABLE, "小萧暂时不在线，请先启动 AI 服务（端口 8000）");
        } catch (RestClientException e) {
            log.error("调用 AI 服务出错", e);
            throw new BusinessException(ErrorCode.AI_UNAVAILABLE, "小萧这边出了点问题，请稍后再试");
        }
    }
}
