import { useState } from "react";
import { Layout, Menu, Badge, Typography } from "antd";
import type { MenuProps } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  HomeOutlined,
  ProjectOutlined,
  FlagOutlined,
  RocketOutlined,
  ReadOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  PlusCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  AuditOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { usePendingCount } from "../../context/PendingCountContext";

const { Sider } = Layout;
const { Text } = Typography;

type MenuItem = Required<MenuProps>["items"][number];

export const CustomSider: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { count: pendingCount, licenseCount } = usePendingCount();
  const navigate = useNavigate();
  const location = useLocation();

  // Highlight the best matching route
  const selected = location.pathname;

  const item = (
    key: string,
    label: string,
    icon: React.ReactNode,
    onClick?: () => void,
    extra?: React.ReactNode
  ): MenuItem => ({
    key,
    icon,
    label: extra ? (
      <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>{label}</span>
        {extra}
      </span>
    ) : label,
    onClick: onClick ?? (() => navigate(key)),
  });

  const divider = (key: string): MenuItem => ({
    key,
    type: "divider",
  });

  const groupLabel = (key: string, label: string): MenuItem => ({
    key,
    type: "group",
    label: collapsed ? null : (
      <Text type="secondary" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>
        {label}
      </Text>
    ),
  });

  const menuItems: MenuItem[] = [
    item("/dashboard", "Dashboard", <DashboardOutlined />),
    divider("d1"),

    groupLabel("g-content", "Content"),
    item(
      "/listings",
      "All Listings",
      <HomeOutlined />,
    ),
    item(
      "/listings/pending",
      "Pending Review",
      <ClockCircleOutlined style={{ color: pendingCount > 0 ? "#ff4d4f" : undefined }} />,
      () => navigate("/listings/pending"),
      pendingCount > 0 ? (
        <Badge count={pendingCount} size="small" style={{ marginLeft: 4 }} />
      ) : null
    ),
    item("/listings/create", "New Listing", <PlusCircleOutlined style={{ color: "#1677ff" }} />),
    divider("d2"),

    // رخص الإعلانات العقارية — Property Advertisement Licenses
    item(
      "/licenses",
      "Licenses",
      <AuditOutlined style={{ color: licenseCount > 0 ? "#ff4d4f" : undefined }} />,
      () => navigate("/licenses"),
      licenseCount > 0 ? (
        <Badge count={licenseCount} size="small" style={{ marginLeft: 4, backgroundColor: "#ff4d4f" }} />
      ) : null
    ),
    divider("d-lic"),

    item("/projects", "Projects", <ProjectOutlined />),
    item("/projects/create", "New Project", <PlusCircleOutlined style={{ color: "#1677ff" }} />),
    divider("d3"),

    groupLabel("g-users", "Users"),
    item("/users", "All Users", <UserOutlined />),
    item("/users/create", "New User", <PlusCircleOutlined style={{ color: "#1677ff" }} />),
    divider("d4"),

    groupLabel("g-ops", "Operations"),
    item("/reports", "Reports", <FlagOutlined />),
    item("/promotions", "Promotions", <RocketOutlined />),
    item("/transactions", "Transactions", <DollarOutlined />),
    divider("d5"),

    groupLabel("g-cms", "CMS"),
    item("/blog", "Blog", <ReadOutlined />),
  ];

  return (
    <Sider
      collapsed={collapsed}
      width={220}
      collapsedWidth={64}
      style={{
        height: "100vh",
        position: "sticky",
        top: 0,
        overflow: "auto",
        background: "#fff",
        borderRight: "1px solid #f0f0f0",
        flexShrink: 0,
      }}
    >
      {/* Logo / collapse toggle */}
      <div
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          padding: "0 16px",
          borderBottom: "1px solid #f0f0f0",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setCollapsed((c) => !c)}
      >
        {!collapsed && (
          <>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <HomeOutlined style={{ color: "#1677ff", fontSize: 18 }} />
              <Text strong style={{ fontSize: 15 }}>
                Aqar Admin
              </Text>
            </span>
            <MenuFoldOutlined style={{ color: "#aaa" }} />
          </>
        )}
        {collapsed && <MenuUnfoldOutlined style={{ color: "#aaa" }} />}
      </div>

      <Menu
        mode="inline"
        selectedKeys={[selected]}
        items={menuItems}
        style={{ borderRight: 0, paddingTop: 4 }}
      />
    </Sider>
  );
};
