import { useList, useNavigation, useCustomMutation, useNotification, useInvalidate } from "@refinedev/core";
import {
  Table,
  Space,
  Typography,
  Tag,
  Button,
  Select,
  Input,
  InputNumber,
  Row,
  Col,
  Tooltip,
  Popconfirm,
  Card,
  Image,
  Badge,
  Collapse,
  Divider,
} from "antd";
import {
  EyeOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  DeleteOutlined,
  SearchOutlined,
  PlusOutlined,
  DownloadOutlined,
  StarFilled,
} from "@ant-design/icons";
import { useState } from "react";
import type { CrudFilter } from "@refinedev/core";
import { API_URL } from "../../config";
import { TableSkeleton } from "../../components/common/TableSkeleton";
import { useExportCsv } from "../../hooks/useExportCsv";

const { Title, Text } = Typography;

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Published", value: "published" },
  { label: "Paused", value: "paused" },
  { label: "Paused (Temp)", value: "paused_temp" },
  { label: "Pending", value: "pending" },
  { label: "Expired", value: "expired" },
];

const PROMOTED_OPTIONS = [
  { label: "All", value: "" },
  { label: "Promoted Only", value: "true" },
  { label: "Not Promoted", value: "false" },
];

const STATUS_COLOR: Record<string, string> = {
  published: "green",
  paused: "orange",
  paused_temp: "gold",
  pending: "blue",
  expired: "red",
};

const LISTING_TYPE_COLOR: Record<string, string> = {
  sale: "blue",
  rent_long: "purple",
  rent_short: "cyan",
};

export const ListingList: React.FC = () => {
  const { show, create } = useNavigation();
  const { open } = useNotification();
  const invalidate = useInvalidate();
  const exportCsv = useExportCsv();

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [adNumberSearch, setAdNumberSearch] = useState("");
  const [ownerSearch, setOwnerSearch] = useState("");
  const [priceMin, setPriceMin] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [promotedFilter, setPromotedFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filters: CrudFilter[] = [];
  if (statusFilter) filters.push({ field: "status", operator: "eq", value: statusFilter });
  if (cityFilter) filters.push({ field: "city", operator: "eq", value: cityFilter });

  const { data, isLoading } = useList({
    resource: "listings",
    pagination: { current: page, pageSize },
    filters,
  });

  let listings = (data?.data || []) as Array<Record<string, unknown>>;
  const total = data?.total || 0;

  // Client-side filters
  if (adNumberSearch) {
    listings = listings.filter((l) =>
      (l.adNumber as string)?.toLowerCase().includes(adNumberSearch.toLowerCase())
    );
  }
  if (ownerSearch) {
    listings = listings.filter((l) => {
      const owner = l.owner as Record<string, unknown>;
      return (
        (owner?.name as string)?.toLowerCase().includes(ownerSearch.toLowerCase()) ||
        (owner?.phone as string)?.includes(ownerSearch)
      );
    });
  }
  if (priceMin !== null) {
    listings = listings.filter((l) => Number(l.totalPrice) >= priceMin!);
  }
  if (priceMax !== null) {
    listings = listings.filter((l) => Number(l.totalPrice) <= priceMax!);
  }
  if (promotedFilter === "true") {
    listings = listings.filter((l) => !!l.isPromoted);
  } else if (promotedFilter === "false") {
    listings = listings.filter((l) => !l.isPromoted);
  }

  const { mutate: updateStatus, isLoading: updating } = useCustomMutation();
  const { mutate: deleteListing, isLoading: deleting } = useCustomMutation();

  const handleStatusChange = (id: string, status: string) => {
    updateStatus(
      { url: `${API_URL}/listings/${id}/status`, method: "patch", values: { status } },
      {
        onSuccess: () => {
          open?.({ type: "success", message: `Status set to ${status}` });
          invalidate({ resource: "listings", invalidates: ["list"] });
        },
        onError: (err) => open?.({ type: "error", message: err?.message || "Failed" }),
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteListing(
      { url: `${API_URL}/listings/${id}`, method: "delete", values: {} },
      {
        onSuccess: () => {
          open?.({ type: "success", message: "Listing deleted" });
          invalidate({ resource: "listings", invalidates: ["list"] });
        },
        onError: (err) => open?.({ type: "error", message: err?.message || "Delete failed" }),
      }
    );
  };

  const handleExport = () => {
    exportCsv(
      "listings.csv",
      ["ID", "Ad Number", "Title", "Status", "Type", "Price", "Area", "City", "Owner Phone", "Promoted", "Created"],
      listings.map((l) => [
        l.id as string, l.adNumber as string, l.title as string,
        l.status as string, l.listingType as string,
        l.totalPrice as string, l.area as string, l.city as string,
        (l.owner as Record<string, string>)?.phone,
        l.isPromoted ? "Yes" : "No",
        l.createdAt ? new Date(l.createdAt as string).toLocaleDateString() : "",
      ])
    );
  };

  const columns = [
    {
      title: "Listing",
      key: "listing",
      width: 260,
      render: (_: unknown, record: Record<string, unknown>) => {
        const thumb = (record.coverPhoto as string) || (record.mediaUrls as string[])?.[0];
        return (
          <Space>
            {thumb ? (
              <Image
                src={thumb}
                width={52}
                height={52}
                style={{ objectFit: "cover", borderRadius: 6 }}
                preview={false}
              />
            ) : (
              <div style={{ width: 52, height: 52, background: "#f0f0f0", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Text type="secondary" style={{ fontSize: 10 }}>No img</Text>
              </div>
            )}
            <div>
              <Text strong style={{ fontSize: 13, display: "block" }}>
                {(record.title as string) || `#${record.adNumber}`}
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {record.city as string} · {record.adNumber as string}
              </Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Type",
      key: "type",
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space direction="vertical" size={2}>
          <Tag>{(record.propertyType as string)?.replace(/_/g, " ")}</Tag>
          <Tag color={LISTING_TYPE_COLOR[record.listingType as string] || "default"}>
            {(record.listingType as string)?.replace("_", " ").toUpperCase()}
          </Tag>
        </Space>
      ),
    },
    {
      title: "Price",
      dataIndex: "totalPrice",
      key: "price",
      render: (v: string) =>
        v ? <Text>SAR {Number(v).toLocaleString()}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={STATUS_COLOR[status] || "default"}>{status?.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Promoted",
      dataIndex: "isPromoted",
      key: "isPromoted",
      render: (v: boolean) =>
        v ? (
          <Tag color="gold" icon={<StarFilled />}>
            Featured
          </Tag>
        ) : null,
    },
    {
      title: "Owner",
      key: "owner",
      render: (_: unknown, record: Record<string, unknown>) => {
        const owner = record.owner as Record<string, unknown>;
        return owner ? (
          <div>
            <Text style={{ fontSize: 13 }}>{(owner.name as string) || "—"}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>{owner.phone as string}</Text>
          </div>
        ) : (
          <Text type="secondary">—</Text>
        );
      },
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
      width: 140,
      render: (_: unknown, record: Record<string, unknown>) => {
        const id = record.id as string;
        const status = record.status as string;
        return (
          <Space size="small">
            <Tooltip title="View">
              <Button icon={<EyeOutlined />} size="small" onClick={() => show("listings", id)} />
            </Tooltip>
            {status === "published" ? (
              <Tooltip title="Pause">
                <Button
                  icon={<PauseCircleOutlined />}
                  size="small"
                  loading={updating}
                  onClick={() => handleStatusChange(id, "paused_temp")}
                />
              </Tooltip>
            ) : (
              <Tooltip title="Publish">
                <Popconfirm title="Publish this listing?" onConfirm={() => handleStatusChange(id, "published")} okText="Publish">
                  <Button icon={<PlayCircleOutlined />} size="small" type="primary" loading={updating} />
                </Popconfirm>
              </Tooltip>
            )}
            <Tooltip title="Delete">
              <Popconfirm
                title="Permanently delete this listing?"
                onConfirm={() => handleDelete(id)}
                okText="Delete"
                okButtonProps={{ danger: true }}
              >
                <Button icon={<DeleteOutlined />} size="small" danger loading={deleting} />
              </Popconfirm>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Row justify="space-between" align="middle">
        <Title level={4} style={{ margin: 0 }}>Listings</Title>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            Export CSV
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => create("listings")}>
            Add Listing
          </Button>
        </Space>
      </Row>

      {/* Filters */}
      <Collapse
        defaultActiveKey={["filters"]}
        items={[{
          key: "filters",
          label: "Filters",
          children: (
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={8} md={6}>
                  <Select
                    value={statusFilter}
                    onChange={(v) => { setStatusFilter(v); setPage(1); }}
                    options={STATUS_OPTIONS}
                    style={{ width: "100%" }}
                    placeholder="Status"
                  />
                </Col>
                <Col xs={24} sm={8} md={6}>
                  <Input
                    value={cityFilter}
                    onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
                    placeholder="City"
                    prefix={<SearchOutlined />}
                    allowClear
                  />
                </Col>
                <Col xs={24} sm={8} md={6}>
                  <Select
                    value={promotedFilter}
                    onChange={(v) => setPromotedFilter(v)}
                    options={PROMOTED_OPTIONS}
                    style={{ width: "100%" }}
                    placeholder="Promoted"
                  />
                </Col>
              </Row>
              <Divider style={{ margin: "4px 0" }} />
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={8} md={6}>
                  <Input
                    value={adNumberSearch}
                    onChange={(e) => setAdNumberSearch(e.target.value)}
                    placeholder="Ad number"
                    prefix={<SearchOutlined />}
                    allowClear
                  />
                </Col>
                <Col xs={24} sm={8} md={6}>
                  <Input
                    value={ownerSearch}
                    onChange={(e) => setOwnerSearch(e.target.value)}
                    placeholder="Owner name or phone"
                    prefix={<SearchOutlined />}
                    allowClear
                  />
                </Col>
                <Col xs={12} sm={4} md={3}>
                  <InputNumber
                    value={priceMin}
                    onChange={(v) => setPriceMin(v)}
                    placeholder="Min price"
                    style={{ width: "100%" }}
                    min={0}
                  />
                </Col>
                <Col xs={12} sm={4} md={3}>
                  <InputNumber
                    value={priceMax}
                    onChange={(v) => setPriceMax(v)}
                    placeholder="Max price"
                    style={{ width: "100%" }}
                    min={0}
                  />
                </Col>
                <Col xs={24} sm={4}>
                  <Button
                    block
                    onClick={() => {
                      setStatusFilter(""); setCityFilter(""); setAdNumberSearch("");
                      setOwnerSearch(""); setPriceMin(null); setPriceMax(null);
                      setPromotedFilter(""); setPage(1);
                    }}
                  >
                    Clear Filters
                  </Button>
                </Col>
              </Row>
            </Space>
          ),
        }]}
      />

      {isLoading ? (
        <TableSkeleton rows={10} />
      ) : (
        <Table
          dataSource={listings}
          columns={columns}
          rowKey="id"
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: false,
            showTotal: (t) => `${t} listings`,
            onChange: setPage,
          }}
          scroll={{ x: 960 }}
        />
      )}
    </Space>
  );
};
