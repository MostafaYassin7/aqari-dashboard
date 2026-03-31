import { useState } from "react";
import { useList } from "@refinedev/core";
import {
  Table,
  Space,
  Typography,
  Tag,
  Card,
  Alert,
  Select,
  Row,
  Col,
  Statistic,
} from "antd";
import { DollarOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import type { CrudFilter } from "@refinedev/core";

const { Title, Text } = Typography;

const TYPE_OPTIONS = [
  { label: "All", value: "" },
  { label: "Top-up", value: "top_up" },
  { label: "Purchase", value: "purchase" },
  { label: "Refund", value: "refund" },
];

const TYPE_COLOR: Record<string, string> = {
  top_up: "green",
  purchase: "red",
  refund: "blue",
  default: "default",
};

export const TransactionList: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const filters: CrudFilter[] = [];
  if (typeFilter) filters.push({ field: "referenceType", operator: "eq", value: typeFilter });

  const { data, isLoading } = useList({
    resource: "transactions",
    meta: { path: "/wallet/transactions" },
    pagination: { current: page, pageSize },
    filters,
  });

  const transactions = (data?.data || []) as Array<Record<string, unknown>>;
  const total = data?.total || 0;

  // Compute totals from loaded transactions
  const totalCredit = transactions
    .filter((t) => (t.amount as number) > 0)
    .reduce((sum, t) => sum + (t.amount as number), 0);
  const totalDebit = transactions
    .filter((t) => (t.amount as number) < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount as number), 0);

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      render: (v: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {v}
        </Text>
      ),
    },
    {
      title: "Type",
      key: "type",
      render: (_: unknown, record: Record<string, unknown>) => {
        const type = (record.type || record.referenceType) as string;
        return (
          <Tag color={TYPE_COLOR[type] || "default"}>{type?.replace("_", " ").toUpperCase()}</Tag>
        );
      },
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right" as const,
      render: (v: number) => (
        <Space>
          {v > 0 ? (
            <ArrowUpOutlined style={{ color: "#52c41a" }} />
          ) : (
            <ArrowDownOutlined style={{ color: "#ff4d4f" }} />
          )}
          <Text style={{ color: v > 0 ? "#52c41a" : "#ff4d4f" }} strong>
            SAR {Math.abs(v).toLocaleString()}
          </Text>
        </Space>
      ),
    },
    {
      title: "Balance After",
      dataIndex: "balanceAfter",
      key: "balanceAfter",
      render: (v: number) =>
        v !== undefined ? (
          <Text>SAR {Number(v).toLocaleString()}</Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (v: string) => v || <Text type="secondary">—</Text>,
    },
    {
      title: "Reference",
      key: "reference",
      render: (_: unknown, record: Record<string, unknown>) => {
        if (record.referenceId) {
          return (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.referenceType as string}: {record.referenceId as string}
            </Text>
          );
        }
        return <Text type="secondary">—</Text>;
      },
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) =>
        v ? (
          <Text style={{ fontSize: 12 }}>{new Date(v).toLocaleString()}</Text>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space>
        <DollarOutlined style={{ fontSize: 20, color: "#52c41a" }} />
        <Title level={4} style={{ margin: 0 }}>
          Wallet Transactions
        </Title>
      </Space>

      <Alert
        type="info"
        showIcon
        message="Admin Wallet View"
        description="Currently showing transactions for the admin account. Implement GET /admin/transactions?userId=X to allow viewing any user's transactions."
      />

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Credits (this page)"
              value={totalCredit}
              prefix="SAR"
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Debits (this page)"
              value={totalDebit}
              prefix="SAR"
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Net (this page)"
              value={totalCredit - totalDebit}
              prefix="SAR"
              valueStyle={{ color: totalCredit >= totalDebit ? "#52c41a" : "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Records"
              value={total}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Row gutter={12}>
          <Col xs={24} sm={8}>
            <Select
              value={typeFilter}
              onChange={(v) => { setTypeFilter(v); setPage(1); }}
              options={TYPE_OPTIONS}
              style={{ width: "100%" }}
              placeholder="Filter by type"
            />
          </Col>
        </Row>
      </Card>

      <Table
        dataSource={transactions}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: false,
          showTotal: (t) => `${t} transactions`,
          onChange: setPage,
        }}
        scroll={{ x: 800 }}
      />
    </Space>
  );
};
