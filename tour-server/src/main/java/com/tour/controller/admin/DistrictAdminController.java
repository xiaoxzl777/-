package com.tour.controller.admin;

import com.tour.common.Result;
import com.tour.pojo.dto.DistrictDTO;
import com.tour.pojo.vo.DistrictVO;
import com.tour.service.DistrictService;
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

/** 管理端：片区管理 */
@RestController
@RequestMapping("/api/admin/districts")
@RequiredArgsConstructor
public class DistrictAdminController {

    private final DistrictService districtService;

    @GetMapping
    public Result<List<DistrictVO>> list() {
        return Result.ok(districtService.list());
    }

    @PostMapping
    public Result<Long> add(@RequestBody @Valid DistrictDTO dto) {
        return Result.ok(districtService.add(dto));
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody @Valid DistrictDTO dto) {
        districtService.update(id, dto);
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        districtService.delete(id);
        return Result.ok();
    }
}
