package com.mingyuezai0.dreamchat;

import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.view.Window;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * 把状态栏 / home 三键所在的系统条配色成「当前界面风格」的底色。
 *
 * 安卓 15 起系统强制边到边，setStatusBarColor / setNavigationBarColor 会被忽略，
 * 所以这里主要做两件事：
 *   1) 把窗口（和 decorView）的底色设成当前主题的 --bg —— 系统条后面露出来的就是它；
 *   2) 用 WindowInsetsControllerCompat 切换图标明暗（浅色主题用深色图标，反之亦然）。
 * 系统条本身的高度由 Capacitor 的 adjustMarginsForEdgeToEdge=force 让 WebView 让出来。
 */
@CapacitorPlugin(name = "ThemeBars")
public class ThemeBarsPlugin extends Plugin {

    @PluginMethod
    public void setColors(final PluginCall call) {
        final String bg = call.getString("bg", "#eef1f6");
        final boolean lightBars = Boolean.TRUE.equals(call.getBoolean("light", Boolean.TRUE));
        if (getActivity() == null) {
            call.resolve();
            return;
        }
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    int color = Color.parseColor(bg);
                    Window window = getActivity().getWindow();
                    ColorDrawable drawable = new ColorDrawable(color);
                    window.setBackgroundDrawable(drawable);
                    window.getDecorView().setBackground(drawable);
                    // 这两条在安卓 15+ 会被系统忽略，但老系统上仍然有用
                    window.setStatusBarColor(color);
                    window.setNavigationBarColor(color);
                    WindowInsetsControllerCompat ctrl =
                            WindowCompat.getInsetsController(window, window.getDecorView());
                    if (ctrl != null) {
                        ctrl.setAppearanceLightStatusBars(lightBars);
                        ctrl.setAppearanceLightNavigationBars(lightBars);
                    }
                } catch (Exception ignored) {
                    // 配色失败不影响使用，静默跳过
                }
                call.resolve();
            }
        });
    }
}
