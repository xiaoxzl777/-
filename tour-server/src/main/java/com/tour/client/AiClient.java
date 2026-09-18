package com.tour.client;

import com.tour.common.BusinessException;
import com.tour.common.ErrorCode;
import com.tour.pojo.ai.AiChatRequest;
import com.tour.pojo.ai.AiPlanRequest;
import com.tour.pojo.vo.AiStatusVO;
import com.tour.pojo.vo.ChatReplyVO;
import com.tour.pojo.vo.GreetingVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.net.SocketTimeoutException;
import java.util.function.Supplier;

/**
 * 调用 Python AI 服务（小萧）。接口说明见接口文档第 8 节。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AiClient {

    static final String OFFLINE = "小萧暂时不在线，请先启动 AI 服务";
    static final String TIMEOUT = "请求超时了，再试一次吧";
    static final String FAILED = "小萧这边出了点问题，请稍后再试";

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

    /** 小萧能不能用：AI 服务会去查 DeepSeek 的 Key 和余额 */
    public AiStatusVO status() {
        try {
            AiStatusVO status = aiRestClient.get().uri("/health").retrieve().body(AiStatusVO.class);
            return status != null ? status : new AiStatusVO(false, "AI 服务没有返回状态", null);
        } catch (ResourceAccessException e) {
            log.warn("查询小萧状态时连不上 AI 服务：{}", e.getMessage());
            return new AiStatusVO(false, "AI 服务没有启动", null);
        } catch (RestClientException e) {
            log.error("查询小萧状态出错", e);
            return new AiStatusVO(false, "AI 服务出错了，请查看 AI 服务的日志", null);
        }
    }

    private <T> T call(Supplier<T> request) {
        try {
            T result = request.get();
            if (result == null) {
                throw new BusinessException(ErrorCode.AI_UNAVAILABLE, "小萧没有回应，请稍后再试");
            }
            return result;
        } catch (RestClientResponseException e) {
            log.warn("AI 服务返回错误：{} {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new BusinessException(ErrorCode.AI_UNAVAILABLE, messageOf(e));
        } catch (ResourceAccessException e) {
            // 等太久是读超时；AI 服务没启动是连接被拒绝
            boolean timeout = e.getCause() instanceof SocketTimeoutException;
            log.warn("调用 AI 服务失败：{}", e.getMessage());
            throw new BusinessException(ErrorCode.AI_UNAVAILABLE, timeout ? TIMEOUT : OFFLINE);
        } catch (RestClientException e) {
            log.error("调用 AI 服务出错", e);
            throw new BusinessException(ErrorCode.AI_UNAVAILABLE, FAILED);
        }
    }

    /**
     * 大模型调不通时 AI 服务返回 503，detail.message 是给用户看的提示（“请求超时了，再试一次吧”
     * 或“小萧暂时不能用了，已经通知管理员”），原样转给前端；其他错误用通用提示。
     */
    private String messageOf(RestClientResponseException e) {
        if (e.getStatusCode().value() != ErrorCode.AI_UNAVAILABLE) {
            return FAILED;
        }
        try {
            ErrorBody body = e.getResponseBodyAs(ErrorBody.class);
            if (body != null && body.detail() != null && body.detail().message() != null) {
                return body.detail().message();
            }
        } catch (RestClientException | IllegalStateException ignored) {
            // 返回的不是约定的格式，用通用提示
        }
        return FAILED;
    }

    /** AI 服务出错时的返回：{ "detail": { "code": "TIMEOUT", "message": "请求超时了，再试一次吧" } } */
    record ErrorBody(ErrorDetail detail) {
    }

    record ErrorDetail(String code, String message) {
    }
}
