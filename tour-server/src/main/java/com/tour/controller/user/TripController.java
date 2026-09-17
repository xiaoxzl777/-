package com.tour.controller.user;

import com.tour.common.PageResult;
import com.tour.common.Result;
import com.tour.common.UserContext;
import com.tour.pojo.dto.TripSaveDTO;
import com.tour.pojo.vo.TripDetailVO;
import com.tour.pojo.vo.TripListVO;
import com.tour.service.TripService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** 用户端：我的行程 */
@RestController
@RequestMapping("/api/user/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    @PostMapping
    public Result<Long> save(@RequestBody @Valid TripSaveDTO dto) {
        return Result.ok(tripService.save(UserContext.getUserId(), dto));
    }

    @GetMapping
    public Result<PageResult<TripListVO>> page(
            @RequestParam(defaultValue = "1") @Min(value = 1, message = "页码从 1 开始") int page,
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "每页至少 1 条") @Max(value = 50, message = "每页最多 50 条") int size) {
        return Result.ok(tripService.page(UserContext.getUserId(), page, size));
    }

    @GetMapping("/{id}")
    public Result<TripDetailVO> detail(@PathVariable Long id) {
        return Result.ok(tripService.detail(UserContext.getUserId(), id));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        tripService.delete(UserContext.getUserId(), id);
        return Result.ok();
    }
}
