# 旅运管理系统 (Admin)

基于 **Vue 3** + **Arco Design** + **Node.js** + **Prisma** 的现代化全栈后台管理系统，专为物流配送与旅游资源管理场景打造。

## 🛠 技术栈

### 前端 (Frontend)
- **Framework**: [Vue 3](https://vuejs.org/) (Composition API)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **UI Component Library**: [Arco Design Vue](https://arco.design/vue/)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Routing**: [Vue Router](https://router.vuejs.org/)
- **Networking**: [Axios](https://axios-http.com/)

### 后端 (Backend)
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express](https://expressjs.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Authentication**: JWT (JSON Web Token)

### 部署与环境 (DevOps)
- **Containerization**: [Docker](https://www.docker.com/), Docker Compose

## How to Run

1. **环境准备**: 确保您的机器上已安装 Docker 和 Docker Compose。
2. **一键启动**: 在项目根目录执行：
   ```bash
   docker compose up --build
   ```
3. **数据库初始化**: 容器启动后会自动执行 Prisma 迁移与数据播种。

## Services

- **前端界面**: http://localhost:3000
- **后端接口**: http://localhost:8000/api

## Verification

1. 访问前端界面 http://localhost:3000，使用测试账号 `admin` / `123456` 进行登录。
2. 进入"城市管理"或"司机管理"等基础模块，验证数据是否已成功从 seed 初始化并显示。
3. 测试新建一条数据（如新建城市），并尝试修改和删除该数据，验证完整 CRUD 流程。
4. 进入"订单管理"模块，新建接送单并关联对应的司机与车辆，验证复杂数据关联。
5. 查看控制台日志与系统监控，验证系统的稳定性与日志记录。

## 🧪 测试账号
- **用户名**: `admin`
- **密码**: `123456`

## 📁 模块说明

系统涵盖了从资源管理到业务订单流转的全生命周期管理：

- **📊 系统概览**: 仪表盘展示核心业务指标与运行状态。
- **🌆 城市管理**: 管理业务覆盖的城市基础数据。
- **🚛 车队管理**: 统一管理合作车队，包含负责人及联系方式。
- **👨‍✈️ 司机管理**: 详细记录司机信息，支持与**城市**和**车队**的动态关联（下拉菜单选择）。
- **🚩 导游管理**: 管理导游资源，支持关联城市显示。
- **🍴 餐馆管理**: 记录合作餐馆信息，支持关联城市显示。
- **🛍️ 购物店管理**: 管理购物资源点，支持关联城市显示。
- **🚘 车辆管理**: 对接派车平台的车型映射，确保订单匹配准确性。
- **📝 订单管理**: 系统的核心业务流，处理订单创建、状态流转，并支持车辆、司机与导游的深度关联。
- **⚙️ 系统管理**: 提供用户权限管理及系统运行环境监控。

## ✨ 系统特性

- **极致 UI/UX**:
  - 统一的 Arco Design 视觉风格，提供极致的后台交互体验。
  - 全局表格美化：包含斑马纹、悬停高亮、美化滚动条。
  - **操作列右侧固定**: 无论表格横向如何滚动，操作按钮始终可见，极大提升操作效率。
- **深度数据关联**: 基于 Prisma ORM 实现的实体间深度关联，前端支持联动选择（如司机所属车队的下拉选择）。
- **全自动 CRUD**: 后端采用通用的 CRUD 控制器，支持自动化的关联数据查询。
- **容器化交付**: 100% 容器化环境，屏蔽环境差异，实现一键部署。

## 📝 开发规范
- 严格遵循 `id`, `createdAt`, `updatedAt` 的系统自动化管理原则。
- 模块化视图组织：前端 `src/views` 下每个模块拥有独立的目录。
- 响应式设计：表格支持大数据量下的流畅横向滚动。
