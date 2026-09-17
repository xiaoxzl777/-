package com.tour.mapper;

import com.tour.pojo.entity.TripItem;
import com.tour.pojo.vo.PlanItemVO;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface TripItemMapper {

    int insertBatch(@Param("items") List<TripItem> items);

    /** 查行程的每一站，同时带上地点的名称、插画、坐标、官网 */
    List<PlanItemVO> selectByTripId(Long tripId);

    @Delete("DELETE FROM trip_item WHERE trip_id = #{tripId}")
    int deleteByTripId(Long tripId);
}
