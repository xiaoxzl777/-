package com.tour.mapper;

import com.tour.pojo.entity.District;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

public interface DistrictMapper {

    @Select("SELECT * FROM district ORDER BY sort, id")
    List<District> selectAll();

    @Select("SELECT * FROM district WHERE id = #{id}")
    District selectById(Long id);

    @Insert("INSERT INTO district (name, sort) VALUES (#{name}, #{sort})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(District district);

    @Update("UPDATE district SET name = #{name}, sort = #{sort} WHERE id = #{id}")
    int update(District district);

    @Delete("DELETE FROM district WHERE id = #{id}")
    int deleteById(Long id);
}
