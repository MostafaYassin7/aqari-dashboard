import { useEffect, useRef, useState, useCallback } from "react";
import {
  Table,
  Tabs,
  Badge,
  Button,
  Drawer,
  Modal,
  Input,
  Typography,
  Tag,
  Space,
  Descriptions,
  message,
  Divider,
  Spin,
  Empty,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  AuditOutlined,
  CheckOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../../dataProvider";
import { TableSkeleton } from "../../components/common/TableSkeleton";
import { usePendingCount } from "../../context/PendingCountContext";

const { Title, Text } = Typography;
const { TextArea } = Input;

// ─── Types ───────────────────────────────────────────────────────────────────

// نوع المُعلن — The advertiser who submitted the license request
type AdvertiserType = "owner" | "agent" | "broker" | "host";

// حالة المراجعة — Review status set by admin
type ReviewStatus = "pending" | "approved" | "rejected";

// نوع وثيقة الملكية — Type of ownership proof document
type OwnershipDocumentType =
  | "electronic_deed"
  | "property_number"
  | "land_registry"
  | "other";

// نوع هوية المالك — Type of property owner's ID document
type OwnerIdType = "national_id" | "commercial_registration" | "unified_700";

interface License {
  id: string;
  createdAt: string;

  // معرّف المستخدم صاحب الطلب — advertiser who submitted
  advertiserUserId: string;
  advertiserUser: {
    id: string;
    name: string;
    phone: string;
    role: string;
  } | null;

  // نوع المُعلن — determines which fields are required
  advertiserType: AdvertiserType;

  // حالة المراجعة
  reviewStatus: ReviewStatus;

  // معرّف الإعلان المرتبط — null until listing is created
  listingId: string | null;
  listing: {
    id: string;
    adNumber: string;
    title: string;
    city: string;
    listingType: string;
    totalPrice: number;
  } | null;

  // ── وثيقة الملكية (owner / agent) ────────────────────────
  // نوع وثيقة الملكية
  ownershipDocumentType: OwnershipDocumentType | null;
  // رقم الوثيقة (رقم الصك أو رقم العقار أو رقم السجل العيني)
  ownershipDocumentNumber: string | null;

  // ── معلومات المالك (owner / agent / broker) ───────────────
  // نوع هوية المالك
  propertyOwnerIdType: OwnerIdType | null;
  // رقم هوية المالك
  propertyOwnerIdNumber: string | null;
  // تاريخ ميلاد المالك
  propertyOwnerBirthDate: string | null;
  // هل التاريخ بالتقويم الهجري؟
  isHijriCalendar: boolean | null;
  // رقم جوال المالك
  propertyOwnerPhone: string | null;
  // رقم هوية أحد الملاك (عند وجود ملاك متعددين)
  oneOfOwnersNationalId: string | null;
  // رقم السجل التجاري للمنشأة
  establishmentCommercialRegNumber: string | null;

  // ── معلومات الوكيل (agent ONLY) ───────────────────────────
  // رقم الوكالة الرسمية (صادرة من وزارة العدل)
  powerOfAttorneyNumber: string | null;
  // رقم الهوية الوطنية للوكيل
  agentNationalIdNumber: string | null;
  // تاريخ ميلاد الوكيل
  agentBirthDate: string | null;
  // رقم جوال الوكيل
  agentPhone: string | null;

  // ── معلومات المسوق (broker ONLY) ──────────────────────────
  // رقم رخصة فال (رخصة الوساطة والتسويق العقاري)
  falLicenseNumber: string | null;
  // رقم عقد الوساطة (المسجل على منصة الهيئة العامة للعقار)
  brokerageContractNumber: string | null;

  // ── المراجعة ──────────────────────────────────────────────
  // سبب الرفض
  rejectionReason: string | null;
  // تاريخ المراجعة
  reviewedAt: string | null;
  // الأدمن المسؤول عن المراجعة
  reviewedByAdminId: string | null;
  reviewedByAdmin: { id: string; name: string } | null;
}

// ─── Arabic label maps ────────────────────────────────────────────────────────

// نوع المُعلن → Arabic label (matches aqar.fm terminology exactly)
const ADVERTISER_TYPE_AR: Record<AdvertiserType, string> = {
  owner: "مالك",
  agent: "وكيل",
  broker: "مسوق عقاري",
  host: "مضيف",
};

// نوع وثيقة الملكية → Arabic label
const OWNERSHIP_DOC_TYPE_AR: Record<OwnershipDocumentType, string> = {
  electronic_deed: "صك إلكتروني",
  property_number: "رقم العقار",
  land_registry: "رقم السجل العيني",
  other: "غير ذلك",
};

// نوع هوية المالك → Arabic label
const OWNER_ID_TYPE_AR: Record<OwnerIdType, string> = {
  national_id: "هوية وطنية",
  commercial_registration: "سجل تجاري",
  unified_700: "الرقم الموحد 700",
};

// حالة المراجعة → colored Ant Design tag
const STATUS_TAG: Record<ReviewStatus, React.ReactNode> = {
  pending: <Tag color="gold">في الانتظار</Tag>,
  approved: <Tag color="green">تمت الموافقة</Tag>,
  rejected: <Tag color="red">مرفوض</Tag>,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format ISO date string as DD/MM/YYYY HH:mm */
function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Format ISO date string as DD/MM/YYYY */
function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** One labeled row in the detail drawer */
const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <Descriptions.Item label={<Text type="secondary">{label}</Text>}>
    {value ?? <Text type="secondary">—</Text>}
  </Descriptions.Item>
);

// ─── Main Component ───────────────────────────────────────────────────────────

type TabKey = "pending" | "approved" | "rejected" | "all";

export const LicenseList: React.FC = () => {
  const navigate = useNavigate();
  const { refetchLicenseCount } = usePendingCount();

  // ── Data state ──────────────────────────────────────────────────────────────
  const [allLicenses, setAllLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("pending");

  // ── Last-updated counter ────────────────────────────────────────────────────
  const lastFetchedRef = useRef<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);

  // ── Detail drawer ────────────────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);

  // ── Approve dialog ───────────────────────────────────────────────────────────
  const [approveTarget, setApproveTarget] = useState<License | null>(null);
  const [approving, setApproving] = useState(false);

  // ── Reject dialog ────────────────────────────────────────────────────────────
  const [rejectTarget, setRejectTarget] = useState<License | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectReasonError, setRejectReasonError] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // ── Row-level action spinner (licenseId → action) ────────────────────────────
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // ─── Fetch all licenses ─────────────────────────────────────────────────────
  // Calls GET /property-advertisement-licenses/pending
  // Backend currently only has the pending endpoint; all tabs show this data
  // and filter client-side by reviewStatus.
  const fetchLicenses = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(
        "/property-advertisement-licenses/pending"
      );
      // Response: { success: true, data: License[] | { data: License[] } }
      const payload = data?.data;
      const list: License[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : [];

      // Sort newest first by createdAt
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAllLicenses(list);
      lastFetchedRef.current = new Date();
      setSecondsAgo(0);
    } catch {
      message.error("Failed to load licenses");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + auto-refresh every 60 seconds (Pending tab behavior)
  useEffect(() => {
    fetchLicenses();
    const refreshId = setInterval(fetchLicenses, 60_000);
    return () => clearInterval(refreshId);
  }, [fetchLicenses]);

  // Update "X seconds ago" counter every 10 seconds
  useEffect(() => {
    const timerId = setInterval(() => {
      setSecondsAgo(
        Math.floor((Date.now() - lastFetchedRef.current.getTime()) / 1000)
      );
    }, 10_000);
    return () => clearInterval(timerId);
  }, []);

  // ─── Client-side tab filter ─────────────────────────────────────────────────
  const filteredData = (() => {
    if (activeTab === "all") return allLicenses;
    return allLicenses.filter((l) => l.reviewStatus === activeTab);
  })();

  // ─── Approve action ─────────────────────────────────────────────────────────
  /**
   * Sends PATCH /property-advertisement-licenses/:id/review
   * with { reviewStatus: 'approved' }
   * On success: refreshes list + sidebar badge count
   */
  const handleApproveConfirm = async () => {
    if (!approveTarget) return;
    setApproving(true);
    setActionLoadingId(approveTarget.id);
    try {
      await axiosInstance.patch(
        `/property-advertisement-licenses/${approveTarget.id}/review`,
        { reviewStatus: "approved" }
      );
      message.success("✅ License approved — listing published");
      setApproveTarget(null);
      await fetchLicenses();
      refetchLicenseCount();
    } catch (err: unknown) {
      const apiMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message;
      message.error(apiMsg || "Failed to approve license");
    } finally {
      setApproving(false);
      setActionLoadingId(null);
    }
  };

  // ─── Reject action ──────────────────────────────────────────────────────────
  /**
   * Sends PATCH /property-advertisement-licenses/:id/review
   * with { reviewStatus: 'rejected', rejectionReason: '<typed reason>' }
   * rejectionReason must be at least 10 characters (Arabic is preferred)
   * On success: refreshes list + sidebar badge count
   */
  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    if (!rejectReason || rejectReason.trim().length < 10) {
      setRejectReasonError("Please provide a reason (at least 10 characters)");
      return;
    }
    setRejecting(true);
    setActionLoadingId(rejectTarget.id);
    try {
      await axiosInstance.patch(
        `/property-advertisement-licenses/${rejectTarget.id}/review`,
        { reviewStatus: "rejected", rejectionReason: rejectReason.trim() }
      );
      message.success("❌ License rejected — owner notified");
      setRejectTarget(null);
      setRejectReason("");
      setRejectReasonError("");
      await fetchLicenses();
      refetchLicenseCount();
    } catch (err: unknown) {
      const apiMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message;
      message.error(apiMsg || "Failed to reject license");
    } finally {
      setRejecting(false);
      setActionLoadingId(null);
    }
  };

  // ─── Table columns ──────────────────────────────────────────────────────────
  const columns: ColumnsType<License> = [
    {
      title: "#",
      key: "index",
      width: 50,
      render: (_: unknown, __: License, index: number) => index + 1,
    },
    {
      title: "Submitted",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (val: string) => (
        <Text style={{ fontSize: 12 }}>{formatDateTime(val)}</Text>
      ),
    },
    {
      title: "User",
      key: "user",
      render: (_: unknown, record: License) => {
        const user = record.advertiserUser;
        const display = user?.name || user?.phone || "—";
        if (user?.id) {
          return (
            <Button
              type="link"
              size="small"
              style={{ padding: 0 }}
              onClick={() => navigate(`/users/${user.id}`)}
            >
              {display}
            </Button>
          );
        }
        return <Text>{display}</Text>;
      },
    },
    {
      title: "Phone",
      key: "phone",
      render: (_: unknown, record: License) => (
        <Text>{record.advertiserUser?.phone || "—"}</Text>
      ),
    },
    {
      // نوع المُعلن — advertiser type displayed in Arabic
      title: "Advertiser Type",
      dataIndex: "advertiserType",
      key: "advertiserType",
      render: (val: AdvertiserType) => (
        <Text>{ADVERTISER_TYPE_AR[val] || val}</Text>
      ),
    },
    {
      // حالة المراجعة — colored badge
      title: "Status",
      dataIndex: "reviewStatus",
      key: "reviewStatus",
      render: (val: ReviewStatus) => STATUS_TAG[val] || <Tag>{val}</Tag>,
    },
    {
      // معرّف الإعلان — ad number if a listing is linked
      title: "Listing",
      key: "listing",
      render: (_: unknown, record: License) =>
        record.listing?.adNumber ? (
          <Text code>{record.listing.adNumber}</Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 160,
      render: (_: unknown, record: License) => {
        const isActioning = actionLoadingId === record.id;
        return (
          <Space size={4}>
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedLicense(record);
                setDrawerOpen(true);
              }}
            />
            <Button
              size="small"
              type="primary"
              icon={
                isActioning && approveTarget?.id === record.id ? (
                  <Spin size="small" />
                ) : (
                  <CheckCircleOutlined />
                )
              }
              style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
              disabled={isActioning || record.reviewStatus !== "pending"}
              onClick={() => setApproveTarget(record)}
            />
            <Button
              size="small"
              danger
              icon={
                isActioning && rejectTarget?.id === record.id ? (
                  <Spin size="small" />
                ) : (
                  <CloseCircleOutlined />
                )
              }
              disabled={isActioning || record.reviewStatus !== "pending"}
              onClick={() => {
                setRejectTarget(record);
                setRejectReason("");
                setRejectReasonError("");
              }}
            />
          </Space>
        );
      },
    },
  ];

  // ─── Empty states per tab ───────────────────────────────────────────────────
  const emptyContent: Record<TabKey, React.ReactNode> = {
    pending: (
      <Empty
        image={
          <CheckOutlined
            style={{ fontSize: 48, color: "#52c41a" }}
          />
        }
        description={
          <>
            <Title level={5}>All caught up!</Title>
            <Text type="secondary">No pending licenses to review</Text>
          </>
        }
      />
    ),
    approved: <Empty description="No approved licenses yet" />,
    rejected: <Empty description="No rejected licenses" />,
    all: <Empty description="No licenses submitted yet" />,
  };

  // ─── Tab items ──────────────────────────────────────────────────────────────
  const pendingCount = allLicenses.filter((l) => l.reviewStatus === "pending").length;
  const approvedCount = allLicenses.filter((l) => l.reviewStatus === "approved").length;
  const rejectedCount = allLicenses.filter((l) => l.reviewStatus === "rejected").length;

  const tabItems = [
    {
      key: "pending",
      label: (
        <span>
          Pending{" "}
          {pendingCount > 0 && (
            <Badge count={pendingCount} size="small" style={{ marginLeft: 4 }} />
          )}
        </span>
      ),
    },
    {
      key: "approved",
      label: (
        <span>
          Approved{" "}
          {approvedCount > 0 && (
            <Badge
              count={approvedCount}
              size="small"
              style={{ marginLeft: 4, backgroundColor: "#52c41a" }}
            />
          )}
        </span>
      ),
    },
    {
      key: "rejected",
      label: (
        <span>
          Rejected{" "}
          {rejectedCount > 0 && (
            <Badge
              count={rejectedCount}
              size="small"
              style={{ marginLeft: 4, backgroundColor: "#ff4d4f" }}
            />
          )}
        </span>
      ),
    },
    { key: "all", label: `All (${allLicenses.length})` },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "0 8px" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Page title */}
        <Space align="center">
          <AuditOutlined style={{ fontSize: 24, color: "#1677ff" }} />
          <Title level={4} style={{ margin: 0 }}>
            Property Advertisement Licenses
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            رخص الإعلانات العقارية
          </Text>
        </Space>

        {/* Tab bar + table */}
        <div style={{ background: "#fff", borderRadius: 8, padding: "16px 0" }}>
          <Tabs
            activeKey={activeTab}
            onChange={(k) => setActiveTab(k as TabKey)}
            items={tabItems}
            style={{ paddingInline: 16 }}
          />

          {loading ? (
            <div style={{ padding: "0 16px" }}>
              <TableSkeleton rows={5} />
            </div>
          ) : (
            <Table<License>
              dataSource={filteredData}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 20, showSizeChanger: false }}
              locale={{ emptyText: emptyContent[activeTab] }}
              style={{ paddingInline: 8 }}
              size="middle"
            />
          )}

          {/* Last updated timestamp — shown below the table */}
          {!loading && (
            <div style={{ padding: "8px 24px 0" }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Last updated{" "}
                {secondsAgo < 60
                  ? `${secondsAgo}s ago`
                  : `${Math.floor(secondsAgo / 60)}m ago`}
              </Text>
            </div>
          )}
        </div>
      </Space>

      {/* ── Detail Drawer ── */}
      <Drawer
        title={
          <Space>
            <AuditOutlined />
            <span>License Details</span>
            {selectedLicense && STATUS_TAG[selectedLicense.reviewStatus]}
          </Space>
        }
        width={420}
        placement="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ body: { padding: "16px" } }}
      >
        {selectedLicense && <LicenseDetailContent license={selectedLicense} navigate={navigate} />}
      </Drawer>

      {/* ── Approve Confirm Modal ── */}
      <Modal
        title="Approve License"
        open={!!approveTarget}
        onCancel={() => setApproveTarget(null)}
        footer={[
          <Button key="cancel" onClick={() => setApproveTarget(null)}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            type="primary"
            style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
            loading={approving}
            onClick={handleApproveConfirm}
          >
            Confirm Approval
          </Button>,
        ]}
      >
        <p>Are you sure you want to approve this license?</p>
        <p>
          <Text type="secondary">
            The listing will be published immediately.
          </Text>
        </p>
      </Modal>

      {/* ── Reject Modal ── */}
      <Modal
        title={
          <>
            <div>Reject License</div>
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>
              سيتم إخطار صاحب الإعلان بسبب الرفض
            </Text>
          </>
        }
        open={!!rejectTarget}
        onCancel={() => {
          setRejectTarget(null);
          setRejectReason("");
          setRejectReasonError("");
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setRejectTarget(null);
              setRejectReason("");
              setRejectReasonError("");
            }}
          >
            Cancel
          </Button>,
          <Button
            key="reject"
            danger
            loading={rejecting}
            disabled={!rejectReason || rejectReason.trim().length < 10}
            onClick={handleRejectConfirm}
          >
            Reject
          </Button>,
        ]}
      >
        {/* سبب الرفض — rejection reason (Arabic, required, min 10 chars) */}
        <div style={{ marginBottom: 8 }}>
          <Text strong>Rejection Reason (Arabic)</Text>
        </div>
        <TextArea
          rows={4}
          placeholder="اكتب سبب الرفض هنا بوضوح"
          value={rejectReason}
          onChange={(e) => {
            setRejectReason(e.target.value);
            if (e.target.value.trim().length >= 10) setRejectReasonError("");
          }}
          style={{ direction: "rtl" }}
        />
        {rejectReasonError && (
          <Text type="danger" style={{ fontSize: 12 }}>
            {rejectReasonError}
          </Text>
        )}
      </Modal>
    </div>
  );
};

// ─── Detail Drawer Content ────────────────────────────────────────────────────

/**
 * All license fields organized into labeled sections.
 * Sections are shown/hidden based on advertiserType (نوع المُعلن).
 */
const LicenseDetailContent: React.FC<{
  license: License;
  navigate: ReturnType<typeof useNavigate>;
}> = ({ license, navigate }) => {
  const descProps = {
    bordered: true,
    size: "small" as const,
    column: 1,
    labelStyle: { width: 160, color: "#888" },
    contentStyle: { fontWeight: 500 },
  };

  const val = (v: string | null | undefined) =>
    v ? <Text>{v}</Text> : <Text type="secondary">—</Text>;

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      {/* ── معلومات المُعلن — Advertiser Info ── */}
      <div>
        <Title level={5} style={{ marginBottom: 8, color: "#1677ff" }}>
          معلومات المُعلن
        </Title>
        <Descriptions {...descProps}>
          <DetailRow label="Name" value={val(license.advertiserUser?.name)} />
          <DetailRow label="Phone" value={val(license.advertiserUser?.phone)} />
          <DetailRow label="Role" value={val(license.advertiserUser?.role)} />
          <DetailRow
            label="نوع المُعلن"
            value={
              <Text>
                {ADVERTISER_TYPE_AR[license.advertiserType] || license.advertiserType}
              </Text>
            }
          />
        </Descriptions>
      </div>

      {/* ── وثيقة الملكية — Ownership Document (owner / agent) ── */}
      {(license.advertiserType === "owner" || license.advertiserType === "agent") && (
        <>
          <Divider style={{ margin: "4px 0" }} />
          <div>
            <Title level={5} style={{ marginBottom: 8, color: "#1677ff" }}>
              وثيقة الملكية
            </Title>
            <Descriptions {...descProps}>
              <DetailRow
                label="نوع وثيقة الملكية"
                value={
                  license.ownershipDocumentType
                    ? OWNERSHIP_DOC_TYPE_AR[license.ownershipDocumentType]
                    : null
                }
              />
              <DetailRow
                label="رقم الوثيقة"
                value={val(license.ownershipDocumentNumber)}
              />
            </Descriptions>
          </div>
        </>
      )}

      {/* ── معلومات المالك — Owner Info (owner / agent / broker) ── */}
      {license.advertiserType !== "host" && (
        <>
          <Divider style={{ margin: "4px 0" }} />
          <div>
            <Title level={5} style={{ marginBottom: 8, color: "#1677ff" }}>
              معلومات المالك
            </Title>
            <Descriptions {...descProps}>
              <DetailRow
                label="نوع هوية المالك"
                value={
                  license.propertyOwnerIdType
                    ? OWNER_ID_TYPE_AR[license.propertyOwnerIdType]
                    : null
                }
              />
              <DetailRow
                label="رقم هوية المالك"
                value={val(license.propertyOwnerIdNumber)}
              />
              <DetailRow
                label="تاريخ ميلاد المالك"
                value={
                  license.propertyOwnerBirthDate ? (
                    <Text>
                      {formatDate(license.propertyOwnerBirthDate)}{" "}
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        ({license.isHijriCalendar ? "هجري" : "ميلادي"})
                      </Text>
                    </Text>
                  ) : null
                }
              />
              <DetailRow
                label="رقم جوال المالك"
                value={val(license.propertyOwnerPhone)}
              />
              <DetailRow
                label="رقم هوية أحد الملاك"
                value={val(license.oneOfOwnersNationalId)}
              />
              <DetailRow
                label="رقم السجل التجاري"
                value={val(license.establishmentCommercialRegNumber)}
              />
            </Descriptions>
          </div>
        </>
      )}

      {/* ── معلومات الوكيل — Agent Info (agent ONLY) ── */}
      {license.advertiserType === "agent" && (
        <>
          <Divider style={{ margin: "4px 0" }} />
          <div>
            <Title level={5} style={{ marginBottom: 8, color: "#1677ff" }}>
              معلومات الوكيل
            </Title>
            <Descriptions {...descProps}>
              {/* رقم الوكالة الرسمية — issued by Saudi Ministry of Justice */}
              <DetailRow
                label="رقم الوكالة الرسمية"
                value={val(license.powerOfAttorneyNumber)}
              />
              <DetailRow
                label="رقم الهوية الوطنية للوكيل"
                value={val(license.agentNationalIdNumber)}
              />
              <DetailRow
                label="تاريخ ميلاد الوكيل"
                value={val(formatDate(license.agentBirthDate) === "—" ? null : formatDate(license.agentBirthDate))}
              />
              <DetailRow
                label="رقم جوال الوكيل"
                value={val(license.agentPhone)}
              />
            </Descriptions>
          </div>
        </>
      )}

      {/* ── معلومات المسوق — Broker Info (broker ONLY) ── */}
      {license.advertiserType === "broker" && (
        <>
          <Divider style={{ margin: "4px 0" }} />
          <div>
            <Title level={5} style={{ marginBottom: 8, color: "#1677ff" }}>
              معلومات المسوق
            </Title>
            <Descriptions {...descProps}>
              {/* رقم رخصة فال — FAL license issued by الهيئة العامة للعقار */}
              <DetailRow
                label="رقم رخصة فال"
                value={val(license.falLicenseNumber)}
              />
              {/* رقم عقد الوساطة — registered on eservicesredp.rega.gov.sa */}
              <DetailRow
                label="رقم عقد الوساطة"
                value={val(license.brokerageContractNumber)}
              />
            </Descriptions>
          </div>
        </>
      )}

      {/* ── الإعلان المرتبط — Linked Listing (only if listingId is set) ── */}
      {license.listingId && license.listing && (
        <>
          <Divider style={{ margin: "4px 0" }} />
          <div>
            <Title level={5} style={{ marginBottom: 8, color: "#1677ff" }}>
              الإعلان المرتبط
            </Title>
            <Descriptions {...descProps}>
              <DetailRow
                label="رقم الإعلان"
                value={<Text code>{license.listing.adNumber}</Text>}
              />
              <DetailRow label="العنوان" value={val(license.listing.title)} />
              <DetailRow label="المدينة" value={val(license.listing.city)} />
              <DetailRow
                label="نوع الإعلان"
                value={val(license.listing.listingType)}
              />
              <DetailRow
                label="السعر"
                value={
                  license.listing.totalPrice != null ? (
                    <Text>
                      {Number(license.listing.totalPrice).toLocaleString()} SAR
                    </Text>
                  ) : null
                }
              />
            </Descriptions>
            <Button
              icon={<LinkOutlined />}
              size="small"
              style={{ marginTop: 8 }}
              onClick={() => navigate(`/listings/${license.listingId}`)}
            >
              View Listing
            </Button>
          </div>
        </>
      )}

      {/* ── المراجعة — Review Info (only shown if reviewed) ── */}
      {(license.reviewedAt || license.reviewedByAdmin) && (
        <>
          <Divider style={{ margin: "4px 0" }} />
          <div>
            <Title level={5} style={{ marginBottom: 8, color: "#1677ff" }}>
              المراجعة
            </Title>
            <Descriptions {...descProps}>
              <DetailRow
                label="تاريخ المراجعة"
                value={val(formatDateTime(license.reviewedAt))}
              />
              <DetailRow
                label="الأدمن المسؤول"
                value={val(license.reviewedByAdmin?.name)}
              />
              <DetailRow
                label="حالة المراجعة"
                value={STATUS_TAG[license.reviewStatus]}
              />
              {license.reviewStatus === "rejected" && (
                <DetailRow
                  label="سبب الرفض"
                  value={
                    license.rejectionReason ? (
                      <Text style={{ direction: "rtl", display: "block" }}>
                        {license.rejectionReason}
                      </Text>
                    ) : null
                  }
                />
              )}
            </Descriptions>
          </div>
        </>
      )}
    </Space>
  );
};
