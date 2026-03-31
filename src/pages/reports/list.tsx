import { Typography, Card, Alert, Space, Table, Tag, Button, Tooltip, Empty } from "antd";
import { FlagOutlined, CheckCircleOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

// NOTE: The backend does not expose an admin endpoint to list reports.
// This page is built ready for when GET /admin/reports (or GET /engagement/reports with admin role) is implemented.
// Current API: POST /engagement/reports (submit only)

const MOCK_COLUMNS = [
  {
    title: "ID",
    dataIndex: "id",
    key: "id",
  },
  {
    title: "Target",
    key: "target",
    render: (_: unknown, record: Record<string, unknown>) => (
      <Space direction="vertical" size={0}>
        <Tag color={record.targetType === "listing" ? "blue" : "orange"}>
          {(record.targetType as string)?.toUpperCase()}
        </Tag>
        <Text type="secondary" style={{ fontSize: 12 }}>
          ID: {record.targetId as string}
        </Text>
      </Space>
    ),
  },
  {
    title: "Reason",
    dataIndex: "reason",
    key: "reason",
    render: (v: string) => <Tag>{v}</Tag>,
  },
  {
    title: "Description",
    dataIndex: "description",
    key: "description",
    render: (v: string) => v || <Text type="secondary">—</Text>,
  },
  {
    title: "Reporter",
    key: "reporter",
    render: (_: unknown, record: Record<string, unknown>) => {
      const reporter = record.reporter as Record<string, unknown>;
      return reporter ? (
        <Text>{(reporter.name as string) || reporter.phone as string}</Text>
      ) : (
        <Text type="secondary">—</Text>
      );
    },
  },
  {
    title: "Status",
    dataIndex: "resolved",
    key: "resolved",
    render: (v: boolean) =>
      v ? <Tag color="green">Resolved</Tag> : <Tag color="red">Pending</Tag>,
  },
  {
    title: "Created",
    dataIndex: "createdAt",
    key: "createdAt",
    render: (v: string) => (v ? new Date(v).toLocaleDateString() : "—"),
  },
  {
    title: "Actions",
    key: "actions",
    render: () => (
      <Tooltip title="Requires backend admin endpoint">
        <Button icon={<CheckCircleOutlined />} size="small" disabled>
          Resolve
        </Button>
      </Tooltip>
    ),
  },
];

export const ReportList: React.FC = () => {
  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space>
        <FlagOutlined style={{ fontSize: 20, color: "#ff4d4f" }} />
        <Title level={4} style={{ margin: 0 }}>
          Reports
        </Title>
      </Space>

      <Alert
        type="warning"
        showIcon
        message="Backend Admin Endpoint Required"
        description={
          <Space direction="vertical" size={4}>
            <Text>
              The backend does not currently expose an admin endpoint to list all reports.
            </Text>
            <Text>
              <strong>Required endpoints to implement:</strong>
            </Text>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>
                <code>GET /api/v1/admin/reports</code> — List all reports with pagination &amp; filters
              </li>
              <li>
                <code>PATCH /api/v1/admin/reports/:id/resolve</code> — Resolve a report
              </li>
              <li>
                <code>DELETE /api/v1/admin/reports/:id</code> — Dismiss a report
              </li>
            </ul>
            <Text>
              The table below shows the expected UI layout that will be activated once these
              endpoints are available.
            </Text>
          </Space>
        }
        style={{ marginBottom: 8 }}
      />

      <Card title="Flagged Content">
        <Table
          columns={MOCK_COLUMNS}
          dataSource={[]}
          rowKey="id"
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space direction="vertical" align="center">
                    <Text>No reports available</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Implement GET /admin/reports to populate this table
                    </Text>
                  </Space>
                }
              />
            ),
          }}
        />
      </Card>

      <Card title="How to Add Report Management">
        <Space direction="vertical">
          <Text strong>Backend changes needed:</Text>
          <pre
            style={{
              background: "#f6f8fa",
              padding: 16,
              borderRadius: 6,
              fontSize: 13,
              overflowX: "auto",
            }}
          >
{`// NestJS example
@Get('admin/reports')
@Roles(Role.ADMIN)
async listReports(
  @Query('page') page = 1,
  @Query('limit') limit = 10,
  @Query('resolved') resolved?: boolean,
) {
  return this.reportsService.findAll({ page, limit, resolved });
}

@Patch('admin/reports/:id/resolve')
@Roles(Role.ADMIN)
async resolve(@Param('id') id: string) {
  return this.reportsService.resolve(id);
}`}
          </pre>
        </Space>
      </Card>
    </Space>
  );
};
