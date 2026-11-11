package com.medinex.user.service;

import com.medinex.common.exception.BadRequestException;

import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Shared normalization, syntax validation, and reserved-handle rules for MediNex usernames.
 */
public final class UsernamePolicy {

    public static final int MIN_LENGTH = 3;
    public static final int MAX_LENGTH = 50;

    private static final Pattern USERNAME_PATTERN =
            Pattern.compile("^[a-z0-9][a-z0-9_-]{1,48}[a-z0-9]$");

    private static final Set<String> RESERVED_USERNAMES = Set.of(
            "admin", "administrator", "superadmin", "super-admin", "moderator",
            "system", "root", "support", "help", "security", "info", "contact",
            "about", "privacy", "terms", "api", "auth", "login", "register",
            "signup", "signin", "logout", "verify-email", "forgot-password",
            "reset-password", "profile", "settings", "dashboard", "notifications",
            "following", "followers", "follow-stats", "block", "avatar", "banner",
            "username", "username-availability", "users", "user", "team", "teams",
            "medinex", "medinex-official", "shasthosetu", "community", "projects",
            "updates", "events", "uploads", "null", "undefined", "me", "www",
            "mail", "noreply", "postmaster"
    );

    private UsernamePolicy() {
    }

    public static String normalize(String raw) {
        return raw == null ? "" : raw.trim().toLowerCase(Locale.ROOT);
    }

    public static boolean isValidSyntax(String normalized) {
        return normalized != null
                && normalized.length() >= MIN_LENGTH
                && normalized.length() <= MAX_LENGTH
                && USERNAME_PATTERN.matcher(normalized).matches();
    }

    public static boolean isReserved(String normalized) {
        return normalized != null && RESERVED_USERNAMES.contains(normalized);
    }

    public static void validateOrThrow(String normalized) {
        if (normalized == null || normalized.isEmpty()) {
            throw new BadRequestException("Username is required");
        }
        if (normalized.length() < MIN_LENGTH || normalized.length() > MAX_LENGTH) {
            throw new BadRequestException("Username must be between 3 and 50 characters");
        }
        if (!USERNAME_PATTERN.matcher(normalized).matches()) {
            throw new BadRequestException(
                    "Username can only contain letters, numbers, underscores, and hyphens, and must start and end with a letter or number"
            );
        }
        if (isReserved(normalized)) {
            throw new BadRequestException("This username is reserved and cannot be claimed");
        }
    }
}
