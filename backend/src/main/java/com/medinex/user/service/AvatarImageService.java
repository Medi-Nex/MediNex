package com.medinex.user.service;

import com.medinex.common.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Iterator;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;

/**
 * Validates uploaded profile images, strips metadata via clean re-encoding,
 * center-crops to square, and writes multi-resolution JPEG variants:
 * sm (64x64), md (256x256), and lg (512x512).
 */
@Service
@Slf4j
public class AvatarImageService {

    public static final int SIZE_SM = 64;
    public static final int SIZE_MD = 256;
    public static final int SIZE_LG = 512;

    private static final long MAX_UPLOAD_BYTES = 5L * 1024L * 1024L;
    private static final int MIN_DIMENSION_PX = 16;
    private static final int MAX_DIMENSION_PX = 4096;
    private static final Set<String> ALLOWED_FORMATS = Set.of("jpeg", "jpg", "png", "gif", "bmp", "webp");

    public static final int BANNER_WIDTH = 1600;
    public static final int BANNER_HEIGHT = 400;
    private static final int MIN_BANNER_WIDTH_PX = 100;
    private static final int MIN_BANNER_HEIGHT_PX = 40;

    private final Path avatarsRootDir;
    private final Path bannersRootDir;

    public AvatarImageService(@Value("${medinex.storage.upload-dir:./uploads}") String uploadDir) {
        Path root = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.avatarsRootDir = root.resolve("avatars").normalize();
        this.bannersRootDir = root.resolve("banners").normalize();
    }

    public record AvatarVariants(String smUrl, String mdUrl, String lgUrl) {
    }

    public AvatarVariants processAndStoreAvatar(UUID userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please choose an image file to upload");
        }
        if (file.getSize() > MAX_UPLOAD_BYTES) {
            throw new BadRequestException("Profile image must not exceed 5 MB");
        }

        byte[] rawBytes;
        try {
            rawBytes = file.getBytes();
        } catch (IOException e) {
            throw new BadRequestException("Unable to read uploaded image file");
        }

        BufferedImage decoded = decodeAndValidateImage(rawBytes);
        BufferedImage squareRgb = cropCenterSquareToRgb(decoded);

        String imageId = UUID.randomUUID().toString();
        Path userDir = resolveUserAvatarDir(userId);
        try {
            Files.createDirectories(userDir);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to initialize avatar storage directory", e);
        }

        String smFilename = imageId + "-" + AvatarUrlHelper.VARIANT_SM + ".jpg";
        String mdFilename = imageId + "-" + AvatarUrlHelper.VARIANT_MD + ".jpg";
        String lgFilename = imageId + "-" + AvatarUrlHelper.VARIANT_LG + ".jpg";

        writeVariantJpeg(squareRgb, SIZE_SM, 0.88f, safeChildPath(userDir, smFilename));
        writeVariantJpeg(squareRgb, SIZE_MD, 0.90f, safeChildPath(userDir, mdFilename));
        writeVariantJpeg(squareRgb, SIZE_LG, 0.92f, safeChildPath(userDir, lgFilename));

        cleanupOldAvatars(userDir, Set.of(smFilename, mdFilename, lgFilename));

        String baseUrl = "/uploads/avatars/" + userId + "/";
        log.info("[MEDIA] Generated 64px/256px/512px avatar variants for user {}", userId);
        return new AvatarVariants(baseUrl + smFilename, baseUrl + mdFilename, baseUrl + lgFilename);
    }

    public void deleteAvatarsForUser(UUID userId) {
        Path userDir = resolveUserAvatarDir(userId);
        cleanupOldAvatars(userDir, Set.of());
    }

    private BufferedImage decodeAndValidateImage(byte[] rawBytes) {
        try (ImageInputStream iis = ImageIO.createImageInputStream(new ByteArrayInputStream(rawBytes))) {
            if (iis == null) {
                throw new BadRequestException("Invalid image format. Please upload PNG, JPEG, GIF, BMP, or WebP.");
            }
            Iterator<ImageReader> readers = ImageIO.getImageReaders(iis);
            if (!readers.hasNext()) {
                throw new BadRequestException("Unsupported file type. Please upload PNG, JPEG, GIF, BMP, or WebP.");
            }
            ImageReader reader = readers.next();
            try {
                String formatName = reader.getFormatName() != null ? reader.getFormatName().toLowerCase() : "";
                if (!ALLOWED_FORMATS.contains(formatName)) {
                    throw new BadRequestException("Unsupported image format '" + formatName + "'. Use PNG, JPEG, GIF, BMP, or WebP.");
                }
                reader.setInput(iis, true, true);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width < MIN_DIMENSION_PX || height < MIN_DIMENSION_PX) {
                    throw new BadRequestException("Image is too small. Minimum size is 16x16 pixels.");
                }
                if (width > MAX_DIMENSION_PX || height > MAX_DIMENSION_PX) {
                    throw new BadRequestException("Image dimensions exceed 4096x4096 maximum limit.");
                }
                BufferedImage img = reader.read(0);
                if (img == null) {
                    throw new BadRequestException("Could not decode uploaded image content.");
                }
                return img;
            } finally {
                reader.dispose();
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (IOException | RuntimeException e) {
            throw new BadRequestException("Corrupted or invalid image upload.");
        }
    }

    private BufferedImage cropCenterSquareToRgb(BufferedImage source) {
        int width = source.getWidth();
        int height = source.getHeight();
        int squareSize = Math.min(width, height);
        int x = (width - squareSize) / 2;
        int y = (height - squareSize) / 2;

        // Drawing into a fresh TYPE_INT_RGB canvas composites alpha cleanly over white
        // and strips any embedded camera/EXIF metadata from the output image.
        BufferedImage squareRgb = new BufferedImage(squareSize, squareSize, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = squareRgb.createGraphics();
        try {
            g2d.setColor(Color.WHITE);
            g2d.fillRect(0, 0, squareSize, squareSize);
            g2d.drawImage(source, 0, 0, squareSize, squareSize, x, y, x + squareSize, y + squareSize, null);
        } finally {
            g2d.dispose();
        }
        return squareRgb;
    }

    public String processAndStoreBanner(UUID userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please select a banner image file to upload");
        }
        if (file.getSize() > MAX_UPLOAD_BYTES) {
            throw new BadRequestException("Banner image exceeds the 5 MB upload limit");
        }

        byte[] rawBytes;
        try {
            rawBytes = file.getBytes();
        } catch (IOException e) {
            throw new BadRequestException("Could not read uploaded banner file");
        }

        BufferedImage decoded = decodeAndValidateImage(rawBytes);
        if (decoded.getWidth() < MIN_BANNER_WIDTH_PX || decoded.getHeight() < MIN_BANNER_HEIGHT_PX) {
            throw new BadRequestException("Banner image must be at least 100x40 pixels");
        }

        BufferedImage cropped = cropAspectToRgb(decoded, (double) BANNER_WIDTH / BANNER_HEIGHT);
        BufferedImage resized = scaleProgressive(cropped, BANNER_WIDTH, BANNER_HEIGHT);

        Path userDir = resolveUserBannerDir(userId);
        try {
            Files.createDirectories(userDir);
        } catch (IOException e) {
            throw new IllegalStateException("Could not prepare user banner storage directory", e);
        }

        String filename = UUID.randomUUID() + "-banner.jpg";
        Path destination = safeChildPath(userDir, filename);
        writeJpegImage(resized, 0.90f, destination);
        cleanupOldAvatars(userDir, Set.of(filename));

        log.info("[MEDIA] Stored profile banner (1600x400) for userId={}", userId);
        return "/uploads/banners/" + userId + "/" + filename;
    }

    public void deleteBannerForUser(UUID userId) {
        Path userDir = resolveUserBannerDir(userId);
        cleanupOldAvatars(userDir, Set.of());
    }

    private BufferedImage cropAspectToRgb(BufferedImage source, double targetAspect) {
        int srcW = source.getWidth();
        int srcH = source.getHeight();
        double srcAspect = (double) srcW / srcH;

        int cropW = srcW;
        int cropH = srcH;
        if (srcAspect > targetAspect) {
            cropW = Math.max(1, (int) Math.round(srcH * targetAspect));
        } else if (srcAspect < targetAspect) {
            cropH = Math.max(1, (int) Math.round(srcW / targetAspect));
        }

        int cropX = Math.max(0, (srcW - cropW) / 2);
        int cropY = Math.max(0, (srcH - cropH) / 2);

        BufferedImage rgb = new BufferedImage(cropW, cropH, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = rgb.createGraphics();
        try {
            g2d.setColor(java.awt.Color.WHITE);
            g2d.fillRect(0, 0, cropW, cropH);
            g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            g2d.drawImage(source, 0, 0, cropW, cropH, cropX, cropY, cropX + cropW, cropY + cropH, null);
        } finally {
            g2d.dispose();
        }
        return rgb;
    }

    private BufferedImage scaleSquareProgressive(BufferedImage src, int targetSize) {
        return scaleProgressive(src, targetSize, targetSize);
    }

    private BufferedImage scaleProgressive(BufferedImage src, int targetWidth, int targetHeight) {
        BufferedImage current = src;
        int currentWidth = src.getWidth();
        int currentHeight = src.getHeight();

        // Step-down halving preserves crisp detail for resized JPEG outputs.
        while (currentWidth > targetWidth && currentHeight > targetHeight
                && currentWidth / 2 >= targetWidth && currentHeight / 2 >= targetHeight) {
            int nextWidth = Math.max(targetWidth, currentWidth / 2);
            int nextHeight = Math.max(targetHeight, currentHeight / 2);
            current = drawScaledRgb(current, nextWidth, nextHeight);
            currentWidth = nextWidth;
            currentHeight = nextHeight;
        }

        if (currentWidth != targetWidth || currentHeight != targetHeight) {
            current = drawScaledRgb(current, targetWidth, targetHeight);
        }
        return current;
    }

    private BufferedImage drawScaledRgb(BufferedImage src, int width, int height) {
        BufferedImage scaled = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = scaled.createGraphics();
        try {
            g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g2d.drawImage(src, 0, 0, width, height, null);
        } finally {
            g2d.dispose();
        }
        return scaled;
    }

    private void writeVariantJpeg(BufferedImage source, int size, float quality, Path destination) {
        BufferedImage resized = scaleSquareProgressive(source, size);
        writeJpegImage(resized, quality, destination);
    }

    private void writeJpegImage(BufferedImage image, float quality, Path destination) {
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpeg");
        if (!writers.hasNext()) {
            throw new IllegalStateException("No JPEG ImageWriter available in JVM runtime");
        }
        ImageWriter writer = writers.next();
        try (OutputStream os = Files.newOutputStream(destination);
             ImageOutputStream ios = ImageIO.createImageOutputStream(os)) {
            writer.setOutput(ios);
            ImageWriteParam param = writer.getDefaultWriteParam();
            if (param.canWriteCompressed()) {
                param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                param.setCompressionQuality(quality);
            }
            writer.write(null, new IIOImage(image, null, null), param);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to write processed image to storage", e);
        } finally {
            writer.dispose();
        }
    }

    private Path resolveUserAvatarDir(UUID userId) {
        return resolveUserScopedDir(avatarsRootDir, userId);
    }

    private Path resolveUserBannerDir(UUID userId) {
        return resolveUserScopedDir(bannersRootDir, userId);
    }

    private Path resolveUserScopedDir(Path rootDir, UUID userId) {
        Path resolved = rootDir.resolve(userId.toString()).normalize();
        if (!resolved.startsWith(rootDir)) {
            throw new BadRequestException("Invalid user path");
        }
        return resolved;
    }

    private Path safeChildPath(Path parentDir, String filename) {
        Path child = parentDir.resolve(filename).normalize();
        if (!child.startsWith(parentDir)) {
            throw new BadRequestException("Invalid file path");
        }
        return child;
    }

    private void cleanupOldAvatars(Path userDir, Set<String> keepFilenames) {
        if (!Files.isDirectory(userDir)) {
            return;
        }
        try (Stream<Path> files = Files.list(userDir)) {
            files.filter(Files::isRegularFile)
                    .filter(p -> !keepFilenames.contains(p.getFileName().toString()))
                    .forEach(p -> {
                        try {
                            Files.deleteIfExists(p);
                        } catch (IOException ex) {
                            log.warn("[MEDIA] Failed to delete stale avatar file {}: {}", p, ex.getMessage());
                        }
                    });
        } catch (IOException e) {
            log.warn("[MEDIA] Could not list avatar directory {}: {}", userDir, e.getMessage());
        }
    }
}
