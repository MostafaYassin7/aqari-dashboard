import { useState } from "react";
import {
  Layout,
  AutoComplete,
  Avatar,
  Button,
  Drawer,
  List,
  Space,
  Tag,
  Typography,
  Spin,
} from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  SearchOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { useGetIdentity, useLogout } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../../dataProvider";

const { Header } = Layout;
const { Text } = Typography;

interface SearchResult {
  id: string;
  type: "listing" | "user";
  title: string;
  subtitle: string;
  route: string;
}

export const CustomHeader: React.FC = () => {
  const { data: identity } = useGetIdentity<{ name: string; phone: string }>();
  const { mutate: logout } = useLogout();
  const navigate = useNavigate();

  const [searchValue, setSearchValue] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data } = await axiosInstance.get("/search/by-reference", {
        params: { q: value.trim() },
      });
      const raw =
        (data?.data?.data as unknown[]) ||
        (data?.data as unknown[]) ||
        (data?.items as unknown[]) ||
        [];
      const parsed: SearchResult[] = (raw as Array<Record<string, unknown>>).map(
        (item) => {
          const isUser = !!item.phone;
          return {
            id: item.id as string,
            type: isUser ? "user" : "listing",
            title: isUser
              ? ((item.name as string) || (item.phone as string))
              : ((item.title as string) || `#${item.adNumber}`),
            subtitle: isUser
              ? (item.phone as string)
              : `${item.city} · ${item.adNumber || item.id}`,
            route: isUser ? `/users/${item.id}` : `/listings/${item.id}`,
          };
        }
      );
      setResults(parsed);
      if (parsed.length > 0) setDrawerOpen(true);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <Header
      style={{
        background: "#fff",
        borderBottom: "1px solid #f0f0f0",
        padding: "0 24px",
        height: 56,
        lineHeight: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Left: placeholder for hamburger on mobile (handled by sider toggle) */}
      <div style={{ width: 40 }} />

      {/* Center: Global Search */}
      <AutoComplete
        value={searchValue}
        onChange={setSearchValue}
        onSearch={handleSearch}
        options={results.map((r) => ({
          value: r.id,
          label: (
            <div
              style={{ display: "flex", justifyContent: "space-between" }}
              onClick={() => {
                navigate(r.route);
                setSearchValue("");
                setDrawerOpen(false);
              }}
            >
              <span>{r.title}</span>
              <Tag color={r.type === "listing" ? "blue" : "green"}>
                {r.type}
              </Tag>
            </div>
          ),
        }))}
        notFoundContent={searching ? <Spin size="small" /> : null}
        style={{ width: 320 }}
      >
        <AutoComplete.Option value="">
          <SearchOutlined />
        </AutoComplete.Option>
      </AutoComplete>

      {/* Right: Identity + Logout */}
      <Space size="middle">
        <Space size="small">
          <Avatar
            icon={<UserOutlined />}
            style={{ background: "#1677ff" }}
            size={32}
          />
          <Text style={{ fontSize: 13 }}>
            {identity?.name || identity?.phone || "Admin"}
          </Text>
        </Space>
        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={() => logout()}
          style={{ color: "#ff4d4f" }}
        >
          Logout
        </Button>
      </Space>

      {/* Search Results Drawer */}
      <Drawer
        title={`Search results for "${searchValue}"`}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={400}
        placement="right"
      >
        {results.length === 0 ? (
          <Text type="secondary">No results found</Text>
        ) : (
          <List
            dataSource={results}
            renderItem={(item) => (
              <List.Item
                style={{ cursor: "pointer" }}
                onClick={() => {
                  navigate(item.route);
                  setDrawerOpen(false);
                  setSearchValue("");
                }}
                extra={
                  <Tag color={item.type === "listing" ? "blue" : "green"}>
                    {item.type}
                  </Tag>
                }
              >
                <List.Item.Meta
                  avatar={
                    item.type === "listing" ? (
                      <HomeOutlined style={{ fontSize: 20, color: "#1677ff" }} />
                    ) : (
                      <UserOutlined style={{ fontSize: 20, color: "#52c41a" }} />
                    )
                  }
                  title={item.title}
                  description={item.subtitle}
                />
              </List.Item>
            )}
          />
        )}
      </Drawer>
    </Header>
  );
};
