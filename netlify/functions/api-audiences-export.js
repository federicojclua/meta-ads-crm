import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { errorResponse } from './_shared/response.js';
import { normalizePhoneNumber } from '../../models/WhatsApp.js';

export async function handler(event) {
  const auth = await verifyAuthorizedUser(event);
  if (!auth.authorized) {
    return errorResponse(auth.status, auth.error, auth.code);
  }

  const { db, clientScope, isGlobal } = auth;
  const params = event.queryStringParameters || {};
  const stageFilter = params.stage || 'all';

  const query = {};
  if (!isGlobal) {
    query.clientId = ObjectId.isValid(clientScope) ? new ObjectId(clientScope) : clientScope;
  } else if (params.clientId && params.clientId !== 'all') {
    query.clientId = ObjectId.isValid(params.clientId) ? new ObjectId(params.clientId) : params.clientId;
  }

  if (stageFilter && stageFilter !== 'all') {
    if (stageFilter === 'stalled') {
      query.stage = { $in: ['qualified', 'contacted'] };
    } else {
      query.stage = stageFilter;
    }
  }

  try {
    const leadsCollection = db.collection('leads');
    const leads = await leadsCollection.find(query).toArray();

    // Generate CSV Header (Meta Ads Custom Audience standard)
    const headers = ['email', 'phone', 'fn', 'ln', 'country', 'value'];
    const rows = [headers.join(',')];

    for (const lead of leads) {
      const email = (lead.email || '').trim().toLowerCase();
      const phone = normalizePhoneNumber(lead.phone || '');
      const fullName = (lead.name || '').trim();
      const nameParts = fullName.split(' ');
      const fn = nameParts[0] || '';
      const ln = nameParts.slice(1).join(' ') || '';
      const country = 'AR';
      const value = (lead.valueEstimateMinor ? (lead.valueEstimateMinor / 100) : 0).toString();

      // Only include row if at least email or phone exists
      if (email || phone) {
        rows.push(
          [
            `"${email}"`,
            `"${phone}"`,
            `"${fn}"`,
            `"${ln}"`,
            `"${country}"`,
            `"${value}"`,
          ].join(',')
        );
      }
    }

    const csvContent = rows.join('\n');
    const filename = `meta_custom_audience_${stageFilter}_${new Date().toISOString().slice(0, 10)}.csv`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Access-Control-Allow-Origin': '*',
      },
      body: csvContent,
    };
  } catch (err) {
    console.error('[API_AUDIENCES_EXPORT_ERROR]', err.message);
    return errorResponse(500, 'Error generando archivo de audiencia para Meta.', 'INTERNAL_SERVER_ERROR');
  }
}
