package com.tour.controller.user;

import com.tour.common.PageResult;
import com.tour.common.Result;
import com.tour.pojo.dto.PoiQueryDTO;
import com.tour.pojo.vo.DistrictVO;
import com.tour.pojo.vo.PoiDetailVO;
import com.tour.pojo.vo.PoiVO;
import com.tour.service.DistrictService;
import com.tour.service.PoiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** 用户端：浏览片区和景点（不用登录） */
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class PoiController {

    private final DistrictService districtService;
    private final PoiService poiService;

    @GetMapping("/districts")
    public Result<List<DistrictVO>> districts() {
        return Result.ok(districtService.list());
    }

    @GetMapping("/pois")
    public Result<PageResult<PoiVO>> page(@Valid PoiQueryDTO query) {
        query.setStatus(null); // 用户端只能看已上线的，不接受状态筛选
        return Result.ok(poiService.pageForUser(query));
    }

    @GetMapping("/pois/{id}")
    public Result<PoiDetailVO> detail(@PathVariable Long id) {
        return Result.ok(poiService.detailForUser(id));
    }
}
