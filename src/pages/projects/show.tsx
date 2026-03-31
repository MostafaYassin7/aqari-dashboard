import { useEffect, useState } from "react";
import { useShow, useNavigation, useNotification, useInvalidate } from "@refinedev/core";
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Tag,
  Button,
  Descriptions,
  Table,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Spin,
  Popconfirm,
  Switch,
} from "antd";
import { ArrowLeftOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { axiosInstance } from "../../dataProvider";

const { Title, Text } = Typography;

const UNIT_TYPES = ["studio", "1br", "2br", "3br", "4br", "villa", "commercial"];
const AVAILABILITY = ["available", "sold", "reserved"];

type Unit = Record<string, unknown>;

export const ProjectShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { list } = useNavigation();
  const { open } = useNotification();
  const invalidate = useInvalidate();

  const [addUnitOpen, setAddUnitOpen] = useState(false);
  const [editUnit, setEditUnit] = useState<Unit | null>(null);
  const [saving, setSaving] = useState(false);
  const [usePriceRange, setUsePriceRange] = useState(false);

  // Local units state — source of truth for the table
  const [units, setUnits] = useState<Unit[]>([]);

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const { queryResult } = useShow({
    resource: "projects",
    id,
    queryOptions: { staleTime: 0 },
  });
  const { data, isLoading } = queryResult;
  const rawData = data?.data as Record<string, unknown>;
  const project = (rawData?.data as Record<string, unknown>) || rawData || {};

  // Sync units whenever the project data loads (units live under __units__ in the API response)
  useEffect(() => {
    if (!isLoading) {
      setUnits((project.__units__ as Unit[]) || []);
    }
  }, [project.__units__, isLoading]);

  // Re-fetch the project directly to get fresh __units__
  const refreshUnits = async () => {
    try {
      const { data: res } = await axiosInstance.get(`/projects/${id}`);
      // API: { success: true, data: { ..., __units__: [] } }
      const proj = (res?.data as Record<string, unknown>) || {};
      setUnits((proj.__units__ as Unit[]) || []);
      invalidate({ resource: "projects", invalidates: ["detail"], id });
    } catch {
      invalidate({ resource: "projects", invalidates: ["detail"], id });
    }
  };

  const handleAddUnit = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(values)) {
        if (v !== null && v !== undefined && v !== "") payload[k] = v;
      }
      const { data: res } = await axiosInstance.post(`/projects/${id}/units`, payload);
      const newUnit = (res?.data as Unit) || (res as Unit) || payload;

      // Optimistically add to local state immediately
      setUnits((prev) => [...prev, newUnit]);

      open?.({ type: "success", message: "Unit added" });
      setAddUnitOpen(false);
      addForm.resetFields();
      setUsePriceRange(false);

      // Then confirm with a fresh server fetch
      refreshUnits();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      open?.({ type: "error", message: error?.response?.data?.message || "Failed to add unit" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUnit = async (values: Record<string, unknown>) => {
    if (!editUnit) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(values)) {
        if (v !== null && v !== undefined && v !== "") payload[k] = v;
      }
      await axiosInstance.patch(`/projects/${id}/units/${editUnit.id}`, payload);

      // Update in local state immediately
      setUnits((prev) =>
        prev.map((u) => (u.id === editUnit.id ? { ...u, ...payload } : u))
      );

      open?.({ type: "success", message: "Unit updated" });
      setEditUnit(null);
      editForm.resetFields();

      refreshUnits();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      open?.({ type: "error", message: error?.response?.data?.message || "Failed to update unit" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    try {
      await axiosInstance.delete(`/projects/${id}/units/${unitId}`);
      setUnits((prev) => prev.filter((u) => u.id !== unitId));
      open?.({ type: "success", message: "Unit deleted" });
      refreshUnits();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      open?.({ type: "error", message: error?.response?.data?.message || "Failed to delete unit" });
    }
  };

  const unitColumns = [
    {
      title: "Type",
      dataIndex: "unitType",
      key: "unitType",
      render: (v: string) => <Tag color="blue">{v?.toUpperCase() || "—"}</Tag>,
    },
    {
      title: "Area",
      dataIndex: "area",
      key: "area",
      render: (v: unknown) => (v ? `${v} m²` : "—"),
    },
    {
      title: "Price",
      key: "price",
      render: (_: unknown, rec: Unit) => {
        if (rec.price) return `SAR ${Number(rec.price).toLocaleString()}`;
        if (rec.priceFrom || rec.priceTo) {
          return `SAR ${Number(rec.priceFrom || 0).toLocaleString()} – ${Number(rec.priceTo || 0).toLocaleString()}`;
        }
        return <Text type="secondary">—</Text>;
      },
    },
    {
      title: "Floor",
      dataIndex: "floor",
      key: "floor",
      render: (v: unknown) => v ?? <Text type="secondary">—</Text>,
    },
    {
      title: "Availability",
      dataIndex: "availability",
      key: "availability",
      render: (v: string) => {
        const color = v === "available" ? "green" : v === "sold" ? "red" : "orange";
        return v ? <Tag color={color}>{v.toUpperCase()}</Tag> : <Text type="secondary">—</Text>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: Unit) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setEditUnit(record);
              editForm.setFieldsValue({
                unitType: record.unitType,
                area: record.area,
                price: record.price,
                priceFrom: record.priceFrom,
                priceTo: record.priceTo,
                floor: record.floor,
                availability: record.availability,
              });
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this unit?"
            onConfirm={() => handleDeleteUnit(record.id as string)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => list("projects")}>
          Back
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          {(project.title as string) || `Project #${id}`}
        </Title>
        <Tag color={project.status === "ready" ? "green" : "blue"}>
          {(project.status as string)?.replace("_", " ").toUpperCase()}
        </Tag>
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="Project Details">
            <Descriptions column={1} labelStyle={{ fontWeight: 600 }}>
              <Descriptions.Item label="ID">{(project.id as string) || "—"}</Descriptions.Item>
              <Descriptions.Item label="Title">{(project.title as string) || "—"}</Descriptions.Item>
              <Descriptions.Item label="City">{(project.city as string) || "—"}</Descriptions.Item>
              <Descriptions.Item label="District">{(project.district as string) || "—"}</Descriptions.Item>
              <Descriptions.Item label="Address">{(project.address as string) || "—"}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={project.status === "ready" ? "green" : "blue"}>
                  {(project.status as string)?.replace("_", " ").toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Price Range">
                {project.priceFrom || project.priceTo
                  ? `SAR ${Number(project.priceFrom || 0).toLocaleString()} – ${Number(project.priceTo || 0).toLocaleString()}`
                  : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Delivery">
                {project.deliveryDate
                  ? new Date(project.deliveryDate as string).toLocaleDateString()
                  : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Description">
                {(project.description as string) || "—"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title={`Units (${units.length})`}
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="small"
                onClick={() => {
                  addForm.resetFields();
                  setUsePriceRange(false);
                  setAddUnitOpen(true);
                }}
              >
                Add Unit
              </Button>
            }
          >
            <Table
              dataSource={units}
              columns={unitColumns}
              rowKey={(record, index) => (record.id as string) || String(index)}
              size="small"
              pagination={false}
              locale={{ emptyText: "No units yet — click Add Unit to get started" }}
            />
          </Card>
        </Col>
      </Row>

      {/* ── Add Unit Modal ── */}
      <Modal
        title="Add Unit"
        open={addUnitOpen}
        onCancel={() => { setAddUnitOpen(false); addForm.resetFields(); setUsePriceRange(false); }}
        footer={null}
        destroyOnClose={false}
      >
        <Form form={addForm} layout="vertical" onFinish={handleAddUnit}>
          <Form.Item name="unitType" label="Unit Type" rules={[{ required: true }]}>
            <Select>
              {UNIT_TYPES.map((t) => (
                <Select.Option key={t} value={t}>{t.toUpperCase()}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="area" label="Area (m²)" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="Price Type">
            <Space>
              <Switch
                checked={usePriceRange}
                onChange={setUsePriceRange}
                checkedChildren="Range"
                unCheckedChildren="Fixed"
              />
              <Text type="secondary">{usePriceRange ? "Price range" : "Fixed price"}</Text>
            </Space>
          </Form.Item>

          {usePriceRange ? (
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="priceFrom" label="Price From (SAR)">
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="priceTo" label="Price To (SAR)">
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>
          ) : (
            <Form.Item name="price" label="Price (SAR)">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          )}

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="floor" label="Floor">
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="availability" label="Availability">
                <Select allowClear placeholder="Select…">
                  {AVAILABILITY.map((a) => (
                    <Select.Option key={a} value={a}>{a.toUpperCase()}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Button type="primary" htmlType="submit" block loading={saving}>
            Add Unit
          </Button>
        </Form>
      </Modal>

      {/* ── Edit Unit Modal ── */}
      <Modal
        title="Edit Unit"
        open={!!editUnit}
        onCancel={() => { setEditUnit(null); editForm.resetFields(); }}
        footer={null}
        destroyOnClose={false}
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdateUnit}>
          <Form.Item name="unitType" label="Unit Type">
            <Select>
              {UNIT_TYPES.map((t) => (
                <Select.Option key={t} value={t}>{t.toUpperCase()}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="area" label="Area (m²)">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="priceFrom" label="Price From (SAR)">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priceTo" label="Price To (SAR)">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="price" label="Fixed Price (SAR)">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="floor" label="Floor">
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="availability" label="Availability">
                <Select allowClear>
                  {AVAILABILITY.map((a) => (
                    <Select.Option key={a} value={a}>{a.toUpperCase()}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Button type="primary" htmlType="submit" block loading={saving}>
            Save Changes
          </Button>
        </Form>
      </Modal>
    </Space>
  );
};
