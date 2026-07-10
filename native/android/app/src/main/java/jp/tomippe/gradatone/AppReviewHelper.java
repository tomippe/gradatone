package jp.tomippe.gradatone;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;

import com.google.android.play.core.review.ReviewInfo;
import com.google.android.play.core.review.ReviewManager;
import com.google.android.play.core.review.ReviewManagerFactory;

import java.util.concurrent.TimeUnit;

/**
 * Play ストアの In-App Review。起動回数とクールダウンで表示タイミングを制御する。
 */
public final class AppReviewHelper {
    private static final String PREFS = "gradatone_review";
    private static final String KEY_LAUNCH_COUNT = "launchCount";
    private static final String KEY_LAST_REQUESTED = "lastRequestedAt";

    private static final int LAUNCH_THRESHOLD = 10;
    private static final int COOLDOWN_DAYS = 30;
    private static final long PROMPT_DELAY_MS = 5000;

    private static boolean sessionCounted;

    private AppReviewHelper() {}

    public static void onActivityLaunched(Activity activity) {
        SharedPreferences prefs = activity.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        int launchCount = prefs.getInt(KEY_LAUNCH_COUNT, 0);

        if (!sessionCounted) {
            sessionCounted = true;
            launchCount += 1;
            prefs.edit().putInt(KEY_LAUNCH_COUNT, launchCount).apply();
        }

        if (!shouldRequestReview(launchCount, prefs)) {
            return;
        }

        new Handler(Looper.getMainLooper()).postDelayed(
                () -> requestReview(activity, prefs),
                PROMPT_DELAY_MS
        );
    }

    private static boolean shouldRequestReview(int launchCount, SharedPreferences prefs) {
        if (launchCount < LAUNCH_THRESHOLD) {
            return false;
        }
        String lastRequested = prefs.getString(KEY_LAST_REQUESTED, null);
        if (lastRequested == null || lastRequested.isEmpty()) {
            return true;
        }
        try {
            long lastMs = Long.parseLong(lastRequested);
            long days = TimeUnit.MILLISECONDS.toDays(System.currentTimeMillis() - lastMs);
            return days >= COOLDOWN_DAYS;
        } catch (NumberFormatException e) {
            return true;
        }
    }

    private static void requestReview(Activity activity, SharedPreferences prefs) {
        if (activity.isFinishing()) {
            return;
        }
        ReviewManager manager = ReviewManagerFactory.create(activity);
        manager.requestReviewFlow().addOnCompleteListener(task -> {
            if (!task.isSuccessful()) {
                return;
            }
            ReviewInfo reviewInfo = task.getResult();
            manager.launchReviewFlow(activity, reviewInfo).addOnCompleteListener(flowTask -> {
                if (flowTask.isSuccessful()) {
                    prefs.edit()
                            .putString(KEY_LAST_REQUESTED, String.valueOf(System.currentTimeMillis()))
                            .apply();
                }
            });
        });
    }
}
