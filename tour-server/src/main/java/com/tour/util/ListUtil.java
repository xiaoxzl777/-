package com.tour.util;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 数据库里有些字段用英文逗号保存列表（比如标签、星期），这里负责和 List 互相转换。
 */
public final class ListUtil {

    private ListUtil() {
    }

    /** 列表转成逗号分隔的字符串；空列表返回 null */
    public static String join(Collection<?> values) {
        if (values == null || values.isEmpty()) {
            return null;
        }
        String text = values.stream()
                .filter(Objects::nonNull)
                .map(value -> value.toString().trim())
                .filter(value -> !value.isEmpty())
                .distinct()
                .collect(Collectors.joining(","));
        return text.isEmpty() ? null : text;
    }

    public static List<String> splitStrings(String text) {
        return split(text, Function.identity());
    }

    public static List<Long> splitLongs(String text) {
        return split(text, Long::valueOf);
    }

    public static List<Integer> splitInts(String text) {
        return split(text, Integer::valueOf);
    }

    private static <T> List<T> split(String text, Function<String, T> mapper) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        return Arrays.stream(text.split(","))
                .map(String::trim)
                .filter(part -> !part.isEmpty())
                .map(mapper)
                .collect(Collectors.toList());
    }
}
