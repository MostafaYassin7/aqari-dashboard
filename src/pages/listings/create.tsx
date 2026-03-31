import { useState } from "react";
import { useList, useNotification } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Radio,
  Checkbox,
  Button,
  Card,
  Steps,
  Space,
  Typography,
  Switch,
  Row,
  Col,
  Spin,
  Alert,
} from "antd";
import { ArrowLeftOutlined, ArrowRightOutlined, SendOutlined } from "@ant-design/icons";
import { axiosInstance } from "../../dataProvider";

const { Title, Text } = Typography;
const { Step } = Steps;

const PROPERTY_TYPES = [
  "apartment","villa","floor","land","building","shop",
  "house","rest_house","farm","commercial_office","chalet",
  "warehouse","camp","other",
];
const LISTING_TYPES = [
  { label: "Sale", value: "sale" },
  { label: "Long-term Rent", value: "rent_long" },
  { label: "Short-term Rent", value: "rent_short" },
];
const FACADES = ["north","south","east","west","northeast","northwest","southeast","southwest"];

const FEATURES = [
  { label: "Has Water", value: "hasWater" },
  { label: "Has Electricity", value: "hasElectricity" },
  { label: "Has Sewage", value: "hasSewage" },
  { label: "Private Roof", value: "hasPrivateRoof" },
  { label: "In Villa", value: "isInVilla" },
  { label: "Two Entrances", value: "hasTwoEntrances" },
  { label: "Special Entrance", value: "hasSpecialEntrance" },
];

const CHECKLIST = [
  { label: "Furnished", value: "isFurnished" },
  { label: "Has Kitchen", value: "hasKitchen" },
  { label: "Extra Unit", value: "hasExtraUnit" },
  { label: "Car Entrance", value: "hasCarEntrance" },
  { label: "Elevator", value: "hasElevator" },
];

const STEP_FIELDS: string[][] = [
  ["title", "categoryId", "propertyType", "listingType", "usageType"],
  ["totalPrice", "area", "bedrooms", "bathrooms", "livingRooms", "floor", "propertyAge", "streetWidth", "facade", "commissionPercent"],
  ["city", "district", "latitude", "longitude"],
  ["description"],
  ["features", "checklist"],
];

export const ListingCreate: React.FC = () => {
  const [form] = Form.useForm();
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [hasCommission, setHasCommission] = useState(false);
  const { open } = useNotification();
  const navigate = useNavigate();

  // Load categories
  const { data: catData, isLoading: catsLoading } = useList({
    resource: "listing-categories",
    pagination: { current: 1, pageSize: 100 },
  });
  const categories = ((catData?.data || []) as Array<Record<string, unknown>>).map((c) => ({
    label: `${c.name} (${c.nameAr || ""})`,
    value: c.id as string,
  }));

  const next = async () => {
    try {
      await form.validateFields(STEP_FIELDS[current]);
      setCurrent((c) => c + 1);
    } catch {
      // validation errors shown inline
    }
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
    } catch {
      return;
    }
    const raw = form.getFieldsValue(true) as Record<string, unknown>;

    // Convert features/checklist arrays to boolean flags
    const features = (raw.features as string[]) || [];
    const checklist = (raw.checklist as string[]) || [];
    const allFlags = [...FEATURES, ...CHECKLIST];
    const boolFlags: Record<string, boolean> = {};
    for (const f of allFlags) {
      boolFlags[f.value] = features.includes(f.value) || checklist.includes(f.value);
    }

    // Strip null/empty/undefined
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries({ ...raw, ...boolFlags })) {
      if (k === "features" || k === "checklist") continue;
      if (v !== null && v !== undefined && v !== "") {
        payload[k] = v;
      }
    }
    if (!hasCommission) delete payload.commissionPercent;

    setSubmitting(true);
    try {
      await axiosInstance.post("/listings", payload);
      open?.({ type: "success", message: "Listing created successfully" });
      navigate("/listings");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      open?.({
        type: "error",
        message: error?.response?.data?.message || "Failed to create listing",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { title: "Basic Info" },
    { title: "Pricing" },
    { title: "Location" },
    { title: "Description" },
    { title: "Features" },
  ];

  // Hide/show sections by step
  const show = (step: number) => ({
    style: { display: current === step ? undefined : "none" },
  });

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/listings")}>
          Back
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          Create Listing
        </Title>
      </Space>

      <Card>
        <Steps current={current} items={steps} style={{ marginBottom: 32 }} />

        <Form form={form} layout="vertical" size="large">
          {/* Step 0: Basic Info */}
          <div {...show(0)}>
            <Form.Item name="title" label="Title" rules={[{ required: true }]}>
              <Input placeholder="e.g. Modern Apartment in Al Olaya" />
            </Form.Item>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="categoryId" label="Category" rules={[{ required: true }]}>
                  {catsLoading ? (
                    <Spin size="small" />
                  ) : (
                    <Select options={categories} placeholder="Select category" showSearch />
                  )}
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="propertyType" label="Property Type" rules={[{ required: true }]}>
                  <Select
                    options={PROPERTY_TYPES.map((t) => ({
                      label: t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                      value: t,
                    }))}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="listingType" label="Listing Type" rules={[{ required: true }]}>
                  <Select options={LISTING_TYPES} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="usageType" label="Usage Type" rules={[{ required: true }]}>
                  <Radio.Group>
                    <Radio value="residential">Residential</Radio>
                    <Radio value="commercial">Commercial</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Step 1: Pricing & Size */}
          <div {...show(1)}>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="totalPrice" label="Total Price (SAR)" rules={[{ required: true }]}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="area" label="Area (m²)" rules={[{ required: true }]}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={8}>
                <Form.Item name="bedrooms" label="Bedrooms">
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={8}>
                <Form.Item name="bathrooms" label="Bathrooms">
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={8}>
                <Form.Item name="livingRooms" label="Living Rooms">
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={8}>
                <Form.Item name="floor" label="Floor">
                  <InputNumber style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={8}>
                <Form.Item name="propertyAge" label="Property Age (yrs)">
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={8}>
                <Form.Item name="streetWidth" label="Street Width (m)">
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="facade" label="Facade">
                  <Select
                    allowClear
                    options={FACADES.map((f) => ({
                      label: f.replace(/\b\w/g, (c) => c.toUpperCase()),
                      value: f,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="Commission">
                  <Space>
                    <Switch
                      checked={hasCommission}
                      onChange={setHasCommission}
                    />
                    <Text type="secondary">
                      {hasCommission ? "Enabled" : "Disabled"}
                    </Text>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
            {hasCommission && (
              <Form.Item name="commissionPercent" label="Commission %">
                <InputNumber min={0} max={100} style={{ width: 160 }} addonAfter="%" />
              </Form.Item>
            )}
          </div>

          {/* Step 2: Location */}
          <div {...show(2)}>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="city" label="City" rules={[{ required: true }]}>
                  <Input placeholder="e.g. Riyadh" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="district" label="District">
                  <Input placeholder="e.g. Al Olaya" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="latitude" label="Latitude" rules={[{ required: true }]}>
                  <InputNumber step={0.000001} style={{ width: "100%" }} placeholder="24.7136" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="longitude" label="Longitude" rules={[{ required: true }]}>
                  <InputNumber step={0.000001} style={{ width: "100%" }} placeholder="46.6753" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="address" label="Full Address">
              <Input.TextArea rows={2} />
            </Form.Item>
          </div>

          {/* Step 3: Description */}
          <div {...show(3)}>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={8} placeholder="Describe the property…" />
            </Form.Item>
          </div>

          {/* Step 4: Features & Checklist */}
          <div {...show(4)}>
            <Row gutter={32}>
              <Col xs={24} sm={12}>
                <Form.Item name="features" label="Property Features">
                  <Checkbox.Group
                    options={FEATURES}
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="checklist" label="Amenities">
                  <Checkbox.Group
                    options={CHECKLIST}
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Navigation */}
          <Space style={{ marginTop: 24 }}>
            {current > 0 && (
              <Button onClick={() => setCurrent((c) => c - 1)}>
                <ArrowLeftOutlined /> Back
              </Button>
            )}
            {current < steps.length - 1 && (
              <Button type="primary" onClick={next}>
                Next <ArrowRightOutlined />
              </Button>
            )}
            {current === steps.length - 1 && (
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={submitting}
                onClick={handleSubmit}
              >
                Create Listing
              </Button>
            )}
            <Button onClick={() => navigate("/listings")}>Cancel</Button>
          </Space>
        </Form>
      </Card>
    </Space>
  );
};
