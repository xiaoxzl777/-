package com.tour.mapper;

import com.tour.pojo.entity.PoiOpenRule;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.Collection;
import java.util.List;

public interface PoiOpenRuleMapper {

    @Select("SELECT * FROM poi_open_rule WHERE poi_id = #{poiId} ORDER BY id")
    List<PoiOpenRule> selectByPoiId(Long poiId);

    List<PoiOpenRule> selectByPoiIds(@Param("poiIds") Collection<Long> poiIds);

    @Delete("DELETE FROM poi_open_rule WHERE poi_id = #{poiId}")
    int deleteByPoiId(Long poiId);

    int insertBatch(@Param("rules") List<PoiOpenRule> rules);
}
