#!/usr/bin/env bash
cd "$(dirname "$0")"
echo "四象限游戏化任务应用已启动："
echo "http://127.0.0.1:4173"
echo "按 Ctrl+C 可以关闭。"
python3 -m http.server 4173
