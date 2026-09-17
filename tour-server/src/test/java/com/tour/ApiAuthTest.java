package com.tour;

import com.tour.common.PageResult;
import com.tour.config.JacksonConfig;
import com.tour.config.TourProperties;
import com.tour.controller.admin.AdminLoginController;
import com.tour.controller.admin.PoiAdminController;
import com.tour.controller.user.ChatController;
import com.tour.controller.user.PoiController;
import com.tour.controller.user.TripController;
import com.tour.service.ChatService;
import com.tour.service.DistrictService;
import com.tour.service.PoiService;
import com.tour.service.TripService;
import com.tour.service.impl.AdminServiceImpl;
import com.tour.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

/**
 * 接口权限测试：管理端和用户端的令牌不能混用，浏览景点不用登录。不需要数据库。
 */
@WebMvcTest(controllers = {AdminLoginController.class, PoiAdminController.class, PoiController.class,
        TripController.class, ChatController.class})
@Import({AdminServiceImpl.class, JwtUtil.class, JacksonConfig.class})
@EnableConfigurationProperties(TourProperties.class)
@TestPropertySource(properties = {
        "tour.admin.username=admin",
        "tour.admin.password=88888888",
        "tour.jwt.secret=unit-test-jwt-secret-0123456789-abcdefghij"
})
class ApiAuthTest {

    @Autowired
    private MockMvc mvc;
    @Autowired
    private JwtUtil jwtUtil;

    @MockitoBean
    private PoiService poiService;
    @MockitoBean
    private DistrictService districtService;
    @MockitoBean
    private TripService tripService;
    @MockitoBean
    private ChatService chatService;

    @Test
    void adminLogsInWithTheFixedAccount() throws Exception {
        perform(post("/api/admin/login"), null, "{\"username\":\"admin\",\"password\":\"88888888\"}")
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.name").value("管理员"));
    }

    @Test
    void adminLoginFailsWithWrongPassword() throws Exception {
        perform(post("/api/admin/login"), null, "{\"username\":\"admin\",\"password\":\"12345678\"}")
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    void adminApiNeedsAdminToken() throws Exception {
        when(poiService.pageForAdmin(any())).thenReturn(new PageResult<>(List.of(), 0));
        perform(get("/api/admin/pois"), null, null).andExpect(jsonPath("$.code").value(401));
        perform(get("/api/admin/pois"), userToken(), null).andExpect(jsonPath("$.code").value(403));
        perform(get("/api/admin/pois"), "Bearer broken.token", null).andExpect(jsonPath("$.code").value(401));
        perform(get("/api/admin/pois"), adminToken(), null).andExpect(jsonPath("$.code").value(0));
    }

    @Test
    void userApiNeedsUserToken() throws Exception {
        when(tripService.page(anyLong(), anyInt(), anyInt())).thenReturn(new PageResult<>(List.of(), 0));
        perform(get("/api/user/trips"), null, null).andExpect(jsonPath("$.code").value(401));
        perform(get("/api/user/trips"), adminToken(), null).andExpect(jsonPath("$.code").value(403));
        perform(get("/api/user/trips"), userToken(), null).andExpect(jsonPath("$.code").value(0));
    }

    @Test
    void browsingPoisNeedsNoLogin() throws Exception {
        when(poiService.pageForUser(any())).thenReturn(new PageResult<>(List.of(), 0));
        perform(get("/api/user/pois"), null, null).andExpect(jsonPath("$.code").value(0));
        perform(get("/api/user/districts"), null, null).andExpect(jsonPath("$.code").value(0));
    }

    @Test
    void requestBodiesAreValidated() throws Exception {
        perform(post("/api/user/chat"), userToken(), "{\"message\":\"\"}")
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("说点什么吧"));
        perform(put("/api/admin/pois/1/open-rules"), adminToken(),
                "[{\"weekdays\":[],\"openTime\":\"09:00\",\"closeTime\":\"17:00\"}]")
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("请选择开放的星期"));
        perform(get("/api/user/trips?page=0"), userToken(), null)
                .andExpect(jsonPath("$.code").value(400));
    }

    private String userToken() {
        return "Bearer " + jwtUtil.createToken(JwtUtil.ROLE_USER, "1");
    }

    private String adminToken() {
        return "Bearer " + jwtUtil.createToken(JwtUtil.ROLE_ADMIN, "admin");
    }

    private ResultActions perform(MockHttpServletRequestBuilder request, String token, String body) throws Exception {
        if (token != null) {
            request.header("Authorization", token);
        }
        if (body != null) {
            request.contentType(MediaType.APPLICATION_JSON).content(body);
        }
        return mvc.perform(request);
    }
}
