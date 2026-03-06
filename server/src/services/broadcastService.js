const prisma = require("../config/db");
const pelangganService = require("./pelangganService");
const whatsappService = require("./whatsappService");
const { ResponseError } = require("../error/responseError");

/**
 * Create and start a broadcast campaign
 * @param {Object} data - Broadcast data
 * @param {Object} user - User initiating the broadcast
 */
const createBroadcast = async (data, user) => {
  const { name, message, segments, media, scheduleTime } = data;

  // 1. Create Marketing Campaign
  const campaign = await prisma.marketingCampaign.create({
    data: {
      nama: name,
      deskripsi: `WhatsApp Broadcast: ${name}`,
      tanggalMulai: scheduleTime ? new Date(scheduleTime) : new Date(),
      status: "active",
      targetAudience: JSON.stringify(segments),
      created_by_user_Id: user.id,
      cabangId: user.cabangId, // Optional: link to branch
    },
  });

  // 2. Create Marketing Channel (WhatsApp)
  const channel = await prisma.marketingChannel.create({
    data: {
      campaignId: campaign.id,
      tipeChannel: "whatsapp",
      namaChannel: "WhatsApp Bot",
      createdAt: new Date(),
    },
  });

  // 3. Create Marketing Content
  const content = await prisma.marketingContent.create({
    data: {
      campaignId: campaign.id,
      channelId: channel.id,
      konten: message,
      contentType: "message",
      status: "published",
      isPublished: true,
      publishedAt: new Date(),
      imageUrl: media?.url, // If media exists
      created_by_user_Id: user.id,
    },
  });

  // 4. Execute Broadcast (Async)
  // If scheduled, this should be handled by a scheduler. 
  // For now, if no schedule, run immediately.
  if (!scheduleTime) {
    executeBroadcast(campaign.id).catch(err => {
        console.error(`Broadcast execution failed for campaign ${campaign.id}:`, err);
    });
  }

  return campaign;
};

/**
 * Execute a broadcast campaign
 * @param {String} campaignId 
 */
const executeBroadcast = async (campaignId) => {
  console.log(`Starting broadcast execution for campaign: ${campaignId}`);
  
  const campaign = await prisma.marketingCampaign.findUnique({
    where: { id: campaignId },
    include: {
        contents: true,
    }
  });

  if (!campaign) return;
  if (campaign.status === 'completed' || campaign.status === 'cancelled') return;

  const content = campaign.contents[0]; // Assuming single content for now
  if (!content) return;

  // Parse segments to get target customers
  let segments = {};
  try {
    segments = JSON.parse(campaign.targetAudience || "{}");
  } catch (e) {
    console.error("Failed to parse target audience", e);
  }

  // Fetch bot configuration
  const botConfig = await prisma.botConfig.findFirst({
      where: {
          cabangId: campaign.cabangId,
          isActive: true
      }
  });

  if (!botConfig) {
      console.warn(`[Broadcast] Cannot execute broadcast ${campaign.id}. No active BotConfig found for branch ${campaign.cabangId}.`);
      await prisma.marketingCampaign.update({
          where: { id: campaign.id },
          data: { status: 'failed', deskripsi: 'Broadcast gagal. Bot WhatsApp tidak aktif.' }
      });
      return;
  }

  // Fetch customers
  // We use getAllPelanggan from pelangganService, but we might need to adjust params
  const customerResult = await pelangganService.getAllPelanggan({
      limit: 10000, // Fetch all matching (limit to a reasonable number safety)
      segmen: segments.segmen,
      status: 'aktif', // Only active customers
      cabang_id: campaign.cabangId
  });

  const customers = customerResult.data;
  console.log(`[Broadcast] Found ${customers.length} target customers.`);

  let successCount = 0;
  let failCount = 0;
  
  const wService = new whatsappService();

  // Send messages with delay
  for (const customer of customers) {
      if (!customer.telepon) continue;

      try {
        // Send message
        let formattedPhone = customer.telepon.replace(/[^0-9]/g, '');
        if (formattedPhone.startsWith('0')) formattedPhone = '62' + formattedPhone.slice(1);
        if (!formattedPhone.endsWith('@s.whatsapp.net')) formattedPhone += '@s.whatsapp.net';

        // Replace variables in message
        let personalizedMessage = content.konten
            .replace(/{{name}}/g, customer.namaPelanggan)
            .replace(/{{phone}}/g, customer.telepon);

        // Send logic
        if (content.imageUrl) {
            // Send image if available (not implemented in this simplified version, requires buffer)
            // For now sending text
            await wService.sendMessage(formattedPhone, personalizedMessage, botConfig.deviceId);
        } else {
            await wService.sendMessage(formattedPhone, personalizedMessage, botConfig.deviceId);
        }

        // Log interaction
        await prisma.customerCampaignInteraction.create({
            data: {
                campaignId: campaign.id,
                pelangganId: customer.id,
                interactionType: "message",
                interactionDate: new Date(),
                interactionData: { status: 'sent' }
            }
        });

        successCount++;
      } catch (error) {
          console.error(`Failed to send to ${customer.telepon}:`, error.message);
          failCount++;
          
          // Log failure
           await prisma.customerCampaignInteraction.create({
            data: {
                campaignId: campaign.id,
                pelangganId: customer.id,
                interactionType: "message",
                interactionDate: new Date(),
                interactionData: { status: 'failed', error: error.message }
            }
        });
      }

      // Delay 2-5 seconds
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  }

  // Update campaign status
  await prisma.marketingCampaign.update({
      where: { id: campaign.id },
      data: {
          status: 'completed',
          updatedAt: new Date()
          // We could store metrics here too
      }
  });

  console.log(`Broadcast completed. Success: ${successCount}, Failed: ${failCount}`);
};

/**
 * Get broadcast history
 */
const getBroadcastHistory = async (cabangId) => {
    return prisma.marketingCampaign.findMany({
        where: { 
            cabangId,
            channels: {
                some: { tipeChannel: 'whatsapp' }
            }
        },
        include: {
            analytics: true,
            _count: {
                select: { interactions: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};

module.exports = {
  createBroadcast,
  executeBroadcast,
  getBroadcastHistory
};
