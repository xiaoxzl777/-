package com.tour.client;

import com.tour.common.BusinessException;
import com.tour.pojo.ai.AiChatRequest;
import com.tour.pojo.vo.AiStatusVO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.net.ConnectException;
import java.net.SocketTimeoutException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withException;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/**
 * AI 服务出错时，前端要拿到能看懂的提示；后台要知道小萧能不能用。不需要启动 AI 服务。
 */
class AiClientTest {

    private MockRestServiceServer server;
    private AiClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://ai");
        server = MockRestServiceServer.bindTo(builder).build();
        client = new AiClient(builder.build());
    }

    @Test
    void modelErrorMessageIsPassedThrough() {
        server.expect(requestTo("http://ai/chat")).andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE)
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"detail\":{\"code\":\"LLM_UNAVAILABLE\",\"message\":\"小萧暂时不能用了，已经通知管理员\"}}"));
        assertChatFails("小萧暂时不能用了，已经通知管理员");
    }

    @Test
    void unexpectedErrorGetsAGeneralMessage() {
        server.expect(requestTo("http://ai/chat")).andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE)
                .contentType(MediaType.TEXT_PLAIN).body("Service Unavailable"));
        assertChatFails(AiClient.FAILED);
    }

    @Test
    void validationErrorGetsAGeneralMessage() {
        server.expect(requestTo("http://ai/chat")).andRespond(withStatus(HttpStatus.UNPROCESSABLE_ENTITY)
                .contentType(MediaType.APPLICATION_JSON).body("{\"detail\":[{\"msg\":\"Field required\"}]}"));
        assertChatFails(AiClient.FAILED);
    }

    @Test
    void waitingTooLongIsATimeout() {
        server.expect(requestTo("http://ai/chat")).andRespond(withException(new SocketTimeoutException("Read timed out")));
        assertChatFails(AiClient.TIMEOUT);
    }

    @Test
    void refusedConnectionMeansTheServiceIsNotStarted() {
        server.expect(requestTo("http://ai/chat")).andRespond(withException(new ConnectException("Connection refused")));
        assertChatFails(AiClient.OFFLINE);
    }

    @Test
    void statusComesFromHealth() {
        server.expect(requestTo("http://ai/health")).andRespond(withSuccess(
                "{\"status\":\"ok\",\"available\":false,\"problem\":\"DeepSeek 余额不足，请充值\",\"balance\":\"0.00\"}",
                MediaType.APPLICATION_JSON));
        AiStatusVO status = client.status();
        assertThat(status.isAvailable()).isFalse();
        assertThat(status.getProblem()).isEqualTo("DeepSeek 余额不足，请充值");
        assertThat(status.getBalance()).isEqualTo("0.00");
    }

    @Test
    void statusSaysWhenTheServiceIsNotStarted() {
        server.expect(requestTo("http://ai/health")).andRespond(withException(new ConnectException("Connection refused")));
        AiStatusVO status = client.status();
        assertThat(status.isAvailable()).isFalse();
        assertThat(status.getProblem()).isEqualTo("AI 服务没有启动");
    }

    private void assertChatFails(String message) {
        assertThatThrownBy(() -> client.chat(new AiChatRequest()))
                .isInstanceOf(BusinessException.class)
                .hasMessage(message)
                .extracting("code").isEqualTo(503);
        server.verify();
    }
}
