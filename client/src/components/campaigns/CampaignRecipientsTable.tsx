"use client";

export interface CampaignRecipientRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status?: string;
}

interface CampaignRecipientsTableProps {
  recipients: CampaignRecipientRow[];
  unmatched?: string[];
  showStatus?: boolean;
  emptyMessage?: string;
}

function displayValue(value: string | null | undefined): string {
  return value?.trim() ? value : "—";
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusClassName(status: string): string {
  switch (status) {
    case "opened":
      return "bg-[#abf0ff] text-[#333333]";
    case "delivered":
      return "bg-[#bcfe90] text-[#333333]";
    case "sent":
      return "bg-[#e7ecff] text-[#333333]";
    case "bounced":
    case "failed":
      return "bg-[#ffe0e6] text-[#e44258]";
    case "pending":
    default:
      return "bg-[#f5f6f8] text-[#535768]";
  }
}

export function CampaignRecipientsTable({
  recipients,
  unmatched = [],
  showStatus = false,
  emptyMessage = "No recipients to show yet.",
}: CampaignRecipientsTableProps) {
  if (recipients.length === 0 && unmatched.length === 0) {
    return <p className="text-sm text-[#535768]">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      {recipients.length > 0 ? (
        <div className="table-scroll overflow-x-auto rounded-[16px] border border-[#d0d4e4]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f5f6f8] text-[#535768]">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  Name
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Email
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Phone
                </th>
                {showStatus ? (
                  <th scope="col" className="px-3 py-2 font-medium">
                    Status
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {recipients.map((recipient) => (
                <tr
                  key={recipient.id}
                  className="border-t border-[#d0d4e4] text-[#333333]"
                >
                  <td className="px-3 py-2">{displayValue(recipient.name)}</td>
                  <td className="px-3 py-2">{displayValue(recipient.email)}</td>
                  <td className="px-3 py-2">{displayValue(recipient.phone)}</td>
                  {showStatus ? (
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClassName(recipient.status ?? "pending")}`}
                      >
                        {formatStatus(recipient.status ?? "pending")}
                      </span>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {unmatched.length > 0 ? (
        <div>
          <p className="text-sm font-medium text-[#333333]">Unmatched entries</p>
          <ul className="mt-2 space-y-1 text-sm text-[#e44258]">
            {unmatched.map((value) => (
              <li key={value}>
                {value} — Contact not found. This address will not receive the
                campaign.
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
