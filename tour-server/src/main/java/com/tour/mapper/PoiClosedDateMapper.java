package com.tour.mapper;

import com.tour.pojo.entity.PoiClosedDate;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface PoiClosedDateMapper {

    /** 某个景点的闭馆日；from 不为空时只查这一天及以后的 */
    List<PoiClosedDate> selectByPoiId(@Param("poiId") Long poiId, @Param("from") LocalDate from);

    List<PoiClosedDate> selectByPoiIds(@Param("poiIds") Collection<Long> poiIds, @Param("from") LocalDate from);

    @Select("SELECT COUNT(*) FROM poi_closed_date WHERE poi_id = #{poiId} AND closed_date = #{date}")
    long countByPoiIdAndDate(@Param("poiId") Long poiId, @Param("date") LocalDate date);

    @Insert("INSERT INTO poi_closed_date (poi_id, closed_date, reason) VALUES (#{poiId}, #{closedDate}, #{reason})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(PoiClosedDate closedDate);

    @Delete("DELETE FROM poi_closed_date WHERE id = #{id} AND poi_id = #{poiId}")
    int delete(@Param("poiId") Long poiId, @Param("id") Long id);
}
