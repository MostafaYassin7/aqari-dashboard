import { useCustom, useGetIdentity } from "@refinedev/core";
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  List,
  Tag,
  Spin,
  Space,
} from "antd";
import {
  HomeOutlined,
  ProjectOutlined,
  FlagOutlined,
  RocketOutlined,
  ArrowUpOutlined,
  AuditOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config";

const { Title, Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
  published: "green",
  paused: "orange",
  paused_temp: "gold",
  pending: "blue",
  expired: "red",
};

/** Recursively find the first array in a nested response object */
function extractArray(data: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(data)) return data as Array<Record<string, unknown>>;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    // Common keys that contain the array
    for (const key of ["items", "data", "results", "list"]) {
      if (Array.isArray(d[key])) return d[key] as Array<Record<string, unknown>>;
      if (d[key] && typeof d[key] === "object") {
        const nested = extractArray(d[key]);
        if (nested.length > 0 || Array.isArray((d[key] as Record<string, unknown>)?.items)) {
          return nested;
        }
      }
    }
  }
  return [];
}

function extractTotal(data: unknown): number {
  if (!data || typeof data !== "object") return 0;
  const d = data as Record<string, unknown>;
  // meta.total
  if (d.meta && typeof d.meta === "object") {
    const meta = d.meta as Record<string, number>;
    if (typeof meta.total === "number") return meta.total;
  }
  // data.meta.total
  if (d.data && typeof d.data === "object") {
    const inner = d.data as Record<string, unknown>;
    if (inner.meta && typeof inner.meta === "object") {
      const meta = inner.meta as Record<string, number>;
      if (typeof meta.total === "number") return meta.total;
    }
    if (typeof (inner as Record<string, number>).total === "number") {
      return (inner as Record<string, number>).total;
    }
  }
  if (typeof (d as Record<string, number>).total === "number") {
    return (d as Record<string, number>).total;
  }
  return 0;
}

export const DashboardPage: React.FC = () => {
  const { data: identity } = useGetIdentity<{ name: string; phone: string }>();
  const navigate = useNavigate();

  const { data: listingsData, isLoading: listingsLoading } = useCustom({
    url: `${API_URL}/listings`,
    method: "get",
    config: { query: { page: 1, limit: 5 } },
  });

  const { data: projectsData, isLoading: projectsLoading } = useCustom({
    url: `${API_URL}/projects`,
    method: "get",
    config: { query: { page: 1, limit: 5 } },
  });

  const { data: promotionsData } = useCustom({
    url: `${API_URL}/promotions/my`,
    method: "get",
    config: { query: { page: 1, limit: 100 } },
  });

  const { data: transactionsData } = useCustom({
    url: `${API_URL}/wallet/transactions`,
    method: "get",
    config: { query: { page: 1, limit: 5 } },
  });

  // GET /property-advertisement-licenses/pending/count
  // Returns { count: number } — number of licenses awaiting admin review
  const { data: licCountData } = useCustom({
    url: `${API_URL}/property-advertisement-licenses/pending/count`,
    method: "get",
  });
  const pendingLicensesCount: number =
    (licCountData?.data as Record<string, Record<string, number>>)?.data?.count ?? 0;

  const recentListings = extractArray(listingsData?.data);
  const listingsTotal = extractTotal(listingsData?.data) || recentListings.length;

  const recentProjects = extractArray(projectsData?.data);
  const projectsTotal = extractTotal(projectsData?.data) || recentProjects.length;

  const promotionsList = extractArray(promotionsData?.data);
  const activePromotions = promotionsList.filter((p) => p.status === "active");

  const recentTx = extractArray(transactionsData?.data);

  return (
    <div style={{ padding: "0 8px" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Welcome back, {identity?.name || identity?.phone || "Admin"}
          </Title>
          <Text type="secondary">Here's what's happening on Aqar today</Text>
        </div>

        {/* Pending Licenses — رخص الإعلانات في الانتظار */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <Card
              bordered={false}
              style={{
                background: pendingLicensesCount > 0
                  ? "linear-gradient(135deg, #ff4d4f, #cf1322)"
                  : "linear-gradient(135deg, #52c41a, #389e0d)",
                cursor: "pointer",
              }}
              onClick={() => navigate("/licenses")}
            >
              <Statistic
                title={
                  <span style={{ color: "rgba(255,255,255,0.85)" }}>
                    Pending Licenses &nbsp;
                    <span style={{ fontWeight: 400, fontSize: 12 }}>تراخيص في الانتظار</span>
                  </span>
                }
                value={pendingLicensesCount}
                prefix={<AuditOutlined style={{ color: "white" }} />}
                valueStyle={{ color: "white" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Stats Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ background: "linear-gradient(135deg, #1677ff, #0958d9)" }}>
              <Statistic
                title={<span style={{ color: "rgba(255,255,255,0.85)" }}>Total Listings</span>}
                value={listingsLoading ? undefined : listingsTotal}
                prefix={listingsLoading ? <Spin size="small" /> : <HomeOutlined style={{ color: "white" }} />}
                valueStyle={{ color: "white" }}
                suffix={<ArrowUpOutlined style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ background: "linear-gradient(135deg, #52c41a, #389e0d)" }}>
              <Statistic
                title={<span style={{ color: "rgba(255,255,255,0.85)" }}>Total Projects</span>}
                value={projectsLoading ? undefined : projectsTotal}
                prefix={projectsLoading ? <Spin size="small" /> : <ProjectOutlined style={{ color: "white" }} />}
                valueStyle={{ color: "white" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ background: "linear-gradient(135deg, #fa8c16, #d46b08)" }}>
              <Statistic
                title={<span style={{ color: "rgba(255,255,255,0.85)" }}>Active Promotions</span>}
                value={activePromotions.length}
                prefix={<RocketOutlined style={{ color: "white" }} />}
                valueStyle={{ color: "white" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ background: "linear-gradient(135deg, #eb2f96, #c41d7f)" }}>
              <Statistic
                title={<span style={{ color: "rgba(255,255,255,0.85)" }}>Flagged Reports</span>}
                value="—"
                prefix={<FlagOutlined style={{ color: "white" }} />}
                valueStyle={{ color: "white" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Recent listings + Transactions */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card
              title="Recent Listings"
              extra={<a href="/listings">View all</a>}
              loading={listingsLoading}
            >
              <List
                dataSource={recentListings.slice(0, 5)}
                locale={{ emptyText: "No listings found" }}
                renderItem={(item) => (
                  <List.Item
                    extra={
                      <Tag color={STATUS_COLOR[item.status as string] || "default"}>
                        {(item.status as string)?.toUpperCase()}
                      </Tag>
                    }
                  >
                    <List.Item.Meta
                      title={
                        <a href={`/listings/${item.id}`}>
                          {(item.title as string) || `Listing #${item.id}`}
                        </a>
                      }
                      description={
                        <Text type="secondary">
                          {item.city as string} · {item.propertyType as string}
                          {item.totalPrice ? ` · SAR ${Number(item.totalPrice).toLocaleString()}` : ""}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card title="Recent Transactions" extra={<a href="/transactions">View all</a>}>
              <List
                dataSource={recentTx.slice(0, 5)}
                locale={{ emptyText: "No transactions found" }}
                renderItem={(tx) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Text>
                          {(tx.type as string) || (tx.referenceType as string) || "Transaction"}
                        </Text>
                      }
                      description={
                        <Text type="secondary">
                          {tx.createdAt ? new Date(tx.createdAt as string).toLocaleDateString() : "—"}
                        </Text>
                      }
                    />
                    <Text
                      strong
                      style={{
                        color: (tx.amount as number) > 0 ? "#52c41a" : "#ff4d4f",
                      }}
                    >
                      {(tx.amount as number) > 0 ? "+" : ""}
                      {tx.amount != null
                        ? `SAR ${Math.abs(tx.amount as number).toLocaleString()}`
                        : "—"}
                    </Text>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </Space>
    </div>
  );
};
