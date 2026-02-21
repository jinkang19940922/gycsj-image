@echo off
chcp 65001 >nul
echo ========================================
echo   光影穿梭机 - Docker 打包脚本
echo ========================================
echo.

echo [1/3] 构建 Docker 镜像...
docker build -t gycsj-image:1.0.0 .
if errorlevel 1 (
    echo [错误] Docker 镜像构建失败！
    echo 请确保：
    echo   1. 已安装 Docker Desktop
    echo   2. Docker Desktop 正在运行
    pause
    exit /b 1
)

echo.
echo [2/3] 导出 Docker 镜像...
docker save -o gycsj-image.tar gycsj-image:1.0.0
if errorlevel 1 (
    echo [错误] Docker 镜像导出失败！
    pause
    exit /b 1
)

echo.
echo [3/3] 创建部署包...
powershell -Command "Compress-Archive -Path 'gycsj-image.tar','docker-compose.yml','DEPLOY.md' -DestinationPath 'gycsj-image-deploy.zip' -Force"

echo.
echo ========================================
echo   打包完成！
echo ========================================
echo.
echo 生成的文件:
echo   - gycsj-image.tar (Docker 镜像)
echo   - gycsj-image-deploy.zip (完整部署包)
echo.
echo 部署说明请查看 DEPLOY.md
echo.
pause
