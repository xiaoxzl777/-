package com.tour.controller.admin;

import com.tour.common.PageResult;
import com.tour.common.Result;
import com.tour.pojo.dto.ClosedDateDTO;
import com.tour.pojo.dto.OpenRuleDTO;
import com.tour.pojo.dto.PoiQueryDTO;
import com.tour.pojo.dto.PoiSaveDTO;
import com.tour.pojo.dto.PoiStatusDTO;
import com.tour.pojo.vo.PoiDetailVO;
import com.tour.pojo.vo.PoiVO;
import com.tour.service.PoiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** 管理端：景点管理（含开放时间和闭馆日） */
@RestController
@RequestMapping("/api/admin/pois")
@RequiredArgsConstructor
public class PoiAdminController {

    private final PoiService poiService;

    @GetMapping
    public Result<PageResult<PoiVO>> page(@Valid PoiQueryDTO query) {
        return Result.ok(poiService.pageForAdmin(query));
    }

    @GetMapping("/{id}")
    public Result<PoiDetailVO> detail(@PathVariable Long id) {
        return Result.ok(poiService.detailForAdmin(id));
    }

    @PostMapping
    public Result<Long> add(@RequestBody @Valid PoiSaveDTO dto) {
        return Result.ok(poiService.add(dto));
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody @Valid PoiSaveDTO dto) {
        poiService.update(id, dto);
        return Result.ok();
    }

    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestBody @Valid PoiStatusDTO dto) {
        poiService.updateStatus(id, dto.getStatus());
        return Result.ok();
    }

    @PutMapping("/{id}/open-rules")
    public Result<Void> replaceOpenRules(@PathVariable Long id, @RequestBody List<@Valid OpenRuleDTO> rules) {
        poiService.replaceOpenRules(id, rules);
        return Result.ok();
    }

    @PostMapping("/{id}/closed-dates")
    public Result<Long> addClosedDate(@PathVariable Long id, @RequestBody @Valid ClosedDateDTO dto) {
        return Result.ok(poiService.addClosedDate(id, dto));
    }

    @DeleteMapping("/{id}/closed-dates/{dateId}")
    public Result<Void> deleteClosedDate(@PathVariable Long id, @PathVariable Long dateId) {
        poiService.deleteClosedDate(id, dateId);
        return Result.ok();
    }
}
