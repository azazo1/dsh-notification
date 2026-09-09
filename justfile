# 列出可用的 recipe.
[private]
default:
    @just --list

# 安装项目依赖.
install:
    pnpm install

# 执行 TypeScript 类型检查, 不生成文件.
typecheck:
    pnpm exec tsc --noEmit

# 构建 Host ESM bundle 和类型声明.
build-host:
    pnpm exec tsdown --config tsdown.host.config.ts

# 构建 Web Client IIFE bundle.
build-client:
    pnpm exec tsdown --config tsdown.client.config.ts

# 构建全部 Host 和 Client bundle.
build: build-host build-client

# 执行项目测试套件.
test:
    pnpm test

# 检查 Client loader 注册.
check-client:
    node scripts/check-client.mjs

# 检查类型, 构建, 测试和 Client 注册.
verify:
    just typecheck
    just build
    pnpm test
    just check-client
    pnpm pack --dry-run

# 清除中间产物.
clean:
    rm -rf node_modules/
    rm -rf .tmp/
    rm -rf .pnpm-store/
