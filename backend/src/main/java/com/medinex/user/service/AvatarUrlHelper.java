package com.medinex.user.service;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Shared utility for deriving multi-resolution avatar URLs (`sm` 64px, `md` 256px, `lg` 512px)
 * from a stored canonical avatar path without duplicating variant formatting logic across DTOs.
 */
public final class AvatarUrlHelper {

    public static final String VARIANT_SM = "sm";
    public static final String VARIANT_MD = "md";
    public static final String VARIANT_LG = "lg";

    private static final Pattern LOCAL_VARIANT_PATTERN =
            Pattern.compile("^(?<prefix>/uploads/avatars/.+)-(sm|md|lg)\\.(?<ext>jpg|jpeg|png)$", Pattern.CASE_INSENSITIVE);

    private AvatarUrlHelper() {
    }

    public static String deriveVariant(String avatarUrl, String variant) {
        if (avatarUrl == null || avatarUrl.isBlank()) {
            return null;
        }
        Matcher matcher = LOCAL_VARIANT_PATTERN.matcher(avatarUrl.trim());
        if (!matcher.matches()) {
            return avatarUrl;
        }
        return matcher.group("prefix") + "-" + variant + "." + matcher.group("ext").toLowerCase();
    }
}
