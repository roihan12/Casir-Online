const axios = require('axios');
const formData = require('form-data');

/**
 * WhatsApp Service for go-whatsapp-web-multidevice integration
 * Documentation: https://github.com/aldinokemal/go-whatsapp-web-multidevice
 */
class WhatsappService {
  constructor() {
    // Base URL for the go-whatsapp-web-multidevice service
    this.baseUrl = process.env.WHATSAPP_SERVICE_URL || 'http://localhost:5000';

    // Basic auth credentials (can be configured via env)
    const username = process.env.WHATSAPP_BASIC_AUTH_USERNAME || 'admin';
    const password = process.env.WHATSAPP_BASIC_AUTH_PASSWORD || 'admin';
    this.authHeader = {
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
    };

    // Request timeout
    this.timeout = parseInt(process.env.WHATSAPP_TIMEOUT || '30000', 10);
  }

  /**
   * Get headers with optional device ID
   * Device scoping is required for v8 multi-device support
   */
  getHeaders(deviceId = null) {
    const headers = { ...this.authHeader };
    if (deviceId) {
      headers['X-Device-Id'] = deviceId;
    }
    return headers;
  }

  /**
   * Make HTTP request with error handling
   */
  async request(config) {
    try {
      const response = await axios({
        timeout: this.timeout,
        ...config
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      console.error(`WhatsApp Service Error: ${error}`);
      throw new Error(message);
    }
  }

  // ==================== DEVICE MANAGEMENT ====================

  /**
   * List all registered devices
   * GET /devices
   */
  async getDevices() {
    return this.request({
      method: 'GET',
      url: `${this.baseUrl}/devices`,
      headers: this.getHeaders()
    });
  }

  /**
   * Add a new device
   * POST /devices
   * Body: description (optional)
   */
  async createDevice(description = '') {
    const data = new formData();
    if (description) {
      data.append('description', description);
    }

    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/devices`,
      headers: {
        ...data.getHeaders(),
        ...this.getHeaders()
      },
      data
    });
  }



  /**
   * Get device information
   * GET /devices/:device_id
   */
  async getDeviceInfo(deviceId) {
    return this.request({
      method: 'GET',
      url: `${this.baseUrl}/devices/${encodeURIComponent(deviceId)}`,
      headers: this.getHeaders()
    });
  }

  /**
   * Remove a device
   * DELETE /devices/:device_id
   */
  async removeDevice(deviceId) {
    return this.request({
      method: 'DELETE',
      url: `${this.baseUrl}/devices/${encodeURIComponent(deviceId)}`,
      headers: this.getHeaders()
    });
  }

  // ==================== DEVICE AUTHENTICATION ====================

  /**
   * Login device with QR code
   * GET /devices/:device_id/login
   */
  async loginQR(deviceId) {
    return this.request({
      method: 'GET',
      url: `${this.baseUrl}/devices/${encodeURIComponent(deviceId)}/login`,
      headers: this.getHeaders()
    });
  }

  /**
   * Login device with pairing code
   * POST /devices/:device_id/login/code
   * Body: phone (e.g., 628123456789)
   */
  async loginWithCode(deviceId, phone) {
    const data = new formData();
    data.append('phone', phone);

    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/devices/${encodeURIComponent(deviceId)}/login/code`,
      headers: {
        ...data.getHeaders(),
        ...this.getHeaders()
      },
      data
    });
  }

  /**
   * Logout device
   * POST /devices/:device_id/logout
   */
  async logout(deviceId) {
    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/devices/${encodeURIComponent(deviceId)}/logout`,
      headers: this.getHeaders()
    });
  }

  /**
   * Reconnect device
   * POST /devices/:device_id/reconnect
   */
  async reconnect(deviceId) {
    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/devices/${encodeURIComponent(deviceId)}/reconnect`,
      headers: this.getHeaders()
    });
  }

  /**
   * Get device connection status
   * GET /devices/:device_id/status
   */
  async getDeviceStatus(deviceId) {
    return this.request({
      method: 'GET',
      url: `${this.baseUrl}/devices/${encodeURIComponent(deviceId)}/status`,
      headers: this.getHeaders()
    });
  }

  // ==================== APP UI ENDPOINTS (Legacy) ====================

  /**
   * Login with scan QR (UI endpoint)
   * GET /app/login
   * Note: This endpoint doesn't support device_id parameter in all versions
   * Use this for single device mode or when device-scoped login is not available
   */
  async appLogin(device_id) {
    return this.request({
      method: 'GET',
      url: `${this.baseUrl}/app/login`,
      headers: this.getHeaders(device_id)
    });
  }

  /**
   * Login with pair code (UI endpoint)
   * GET /app/login-with-code
   * @param {string} phone - Phone number for pairing code
   */
  async appLoginWithCode(phone) {
    return this.request({
      method: 'GET',
      url: `${this.baseUrl}/app/login-with-code?phone=${phone}`,
      headers: this.getHeaders()
    });
  }

  /**
   * Get connection status (UI endpoint)
   * GET /app/status
   */
  async getStatus() {
    return this.request({
      method: 'GET',
      url: `${this.baseUrl}/app/status`,
      headers: this.getHeaders()
    });
  }

  // ==================== MESSAGING ====================

  /**
   * Send text message
   * POST /send/message
   * Body: phone, message, reply_message_id (optional)
   */
  async sendMessage(phone, message, deviceId = null, options = {}) {
    const data = new formData();
    data.append('phone', phone);
    data.append('message', message);

    if (options.reply_message_id) {
      data.append('reply_message_id', options.reply_message_id);
    }

    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/send/message`,
      headers: {
        ...data.getHeaders(),
        ...this.getHeaders(deviceId)
      },
      data
    });
  }

  /**
   * Send image with caption
   * POST /send/image
   * Body: phone, image, caption (optional), view_once (optional)
   */
  async sendImage(phone, imageBuffer, filename, deviceId = null, options = {}) {
    const data = new formData();
    data.append('phone', phone);
    data.append('image', imageBuffer, filename);

    if (options.caption) {
      data.append('caption', options.caption);
    }

    if (options.view_once) {
      data.append('view_once', 'true');
    }

    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/send/image`,
      headers: {
        ...data.getHeaders(),
        ...this.getHeaders(deviceId)
      },
      data
    });
  }

  /**
   * Send audio file
   * POST /send/audio
   * Body: phone, audio
   */
  async sendAudio(phone, audioBuffer, filename, deviceId = null) {
    const data = new formData();
    data.append('phone', phone);
    data.append('audio', audioBuffer, filename);

    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/send/audio`,
      headers: {
        ...data.getHeaders(),
        ...this.getHeaders(deviceId)
      },
      data
    });
  }

  /**
   * Send file/document
   * POST /send/file
   * Body: phone, file, caption (optional)
   */
  async sendFile(phone, fileBuffer, filename, deviceId = null, options = {}) {
    const data = new formData();
    data.append('phone', phone);
    data.append('file', fileBuffer, filename);

    if (options.caption) {
      data.append('caption', options.caption);
    }

    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/send/file`,
      headers: {
        ...data.getHeaders(),
        ...this.getHeaders(deviceId)
      },
      data
    });
  }

  /**
   * Send video
   * POST /send/video
   * Body: phone, video, caption (optional)
   */
  async sendVideo(phone, videoBuffer, filename, deviceId = null, options = {}) {
    const data = new formData();
    data.append('phone', phone);
    data.append('video', videoBuffer, filename);

    if (options.caption) {
      data.append('caption', options.caption);
    }

    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/send/video`,
      headers: {
        ...data.getHeaders(),
        ...this.getHeaders(deviceId)
      },
      data
    });
  }

  /**
   * Send sticker (auto-converts to WebP)
   * POST /send/sticker
   * Body: phone, image
   */
  async sendSticker(phone, imageBuffer, filename, deviceId = null) {
    const data = new formData();
    data.append('phone', phone);
    data.append('image', imageBuffer, filename);

    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/send/sticker`,
      headers: {
        ...data.getHeaders(),
        ...this.getHeaders(deviceId)
      },
      data
    });
  }

  /**
   * Send contact
   * POST /send/contact
   * Body: phone, phone_contact, name_contact (optional)
   */
  async sendContact(phone, contactPhone, contactName = '', deviceId = null) {
    const data = new formData();
    data.append('phone', phone);
    data.append('phone_contact', contactPhone);

    if (contactName) {
      data.append('name_contact', contactName);
    }

    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/send/contact`,
      headers: {
        ...data.getHeaders(),
        ...this.getHeaders(deviceId)
      },
      data
    });
  }

  /**
   * Send link with preview
   * POST /send/link
   * Body: phone, link, caption (optional)
   */
  async sendLink(phone, link, deviceId = null, options = {}) {
    const data = new formData();
    data.append('phone', phone);
    data.append('link', link);

    if (options.caption) {
      data.append('caption', options.caption);
    }

    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/send/link`,
      headers: {
        ...data.getHeaders(),
        ...this.getHeaders(deviceId)
      },
      data
    });
  }

  /**
   * Send location
   * POST /send/location
   * Body: phone, latitude, longitude, name (optional), address (optional)
   */
  async sendLocation(phone, latitude, longitude, deviceId = null, options = {}) {
    const data = new formData();
    data.append('phone', phone);
    data.append('latitude', latitude.toString());
    data.append('longitude', longitude.toString());

    if (options.name) {
      data.append('name', options.name);
    }

    if (options.address) {
      data.append('address', options.address);
    }

    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/send/location`,
      headers: {
        ...data.getHeaders(),
        ...this.getHeaders(deviceId)
      },
      data
    });
  }

  /**
   * Send poll/vote
   * POST /send/poll
   * Body: phone, name, options, selectable_count (optional)
   */
  async sendPoll(phone, pollName, pollOptions, deviceId = null, options = {}) {
    const data = new formData();
    data.append('phone', phone);
    data.append('name', pollName);
    data.append('options', Array.isArray(pollOptions) ? pollOptions.join('\n') : pollOptions);

    if (options.selectable_count) {
      data.append('selectable_count', options.selectable_count.toString());
    }

    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/send/poll`,
      headers: {
        ...data.getHeaders(),
        ...this.getHeaders(deviceId)
      },
      data
    });
  }

  // ==================== MESSAGE MANAGEMENT ====================

  /**
   * Revoke/edit message
   * POST /message/:message_id/revoke
   */
  async revokeMessage(messageId, deviceId = null) {
    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/message/${encodeURIComponent(messageId)}/revoke`,
      headers: this.getHeaders(deviceId)
    });
  }

  /**
   * React to message
   * POST /message/:message_id/reaction
   * Body: emoji
   */
  async reactMessage(messageId, emoji, deviceId = null) {
    const data = new formData();
    data.append('emoji', emoji);

    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/message/${encodeURIComponent(messageId)}/reaction`,
      headers: {
        ...data.getHeaders(),
        ...this.getHeaders(deviceId)
      },
      data
    });
  }

  /**
   * Delete message for self
   * POST /message/:message_id/delete
   */
  async deleteMessage(messageId, deviceId = null) {
    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/message/${encodeURIComponent(messageId)}/delete`,
      headers: this.getHeaders(deviceId)
    });
  }

  /**
   * Edit message
   * POST /message/:message_id/update
   * Body: message
   */
  async editMessage(messageId, newMessage, deviceId = null) {
    const data = new formData();
    data.append('message', newMessage);

    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/message/${encodeURIComponent(messageId)}/update`,
      headers: {
        ...data.getHeaders(),
        ...this.getHeaders(deviceId)
      },
      data
    });
  }

  /**
   * Mark message as read
   * POST /message/:message_id/read
   */
  async readMessage(messageId, deviceId = null) {
    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/message/${encodeURIComponent(messageId)}/read`,
      headers: this.getHeaders(deviceId)
    });
  }

  /**
   * Star message
   * POST /message/:message_id/star
   */
  async starMessage(messageId, deviceId = null) {
    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/message/${encodeURIComponent(messageId)}/star`,
      headers: this.getHeaders(deviceId)
    });
  }

  /**
   * Unstar message
   * POST /message/:message_id/unstar
   */
  async unstarMessage(messageId, deviceId = null) {
    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/message/${encodeURIComponent(messageId)}/unstar`,
      headers: this.getHeaders(deviceId)
    });
  }

  /**
   * Download message media
   * GET /message/:message_id/download
   */
  async downloadMedia(messageId, deviceId = null) {
    return this.request({
      method: 'GET',
      url: `${this.baseUrl}/message/${encodeURIComponent(messageId)}/download`,
      headers: this.getHeaders(deviceId),
      responseType: 'arraybuffer'
    });
  }

  // ==================== CHAT MANAGEMENT ====================

  /**
   * Get chat list
   * GET /chats
   * Query: cursor (optional), limit (optional), search (optional)
   */
  async getChats(deviceId = null, options = {}) {
    const params = {};
    if (options.cursor) params.cursor = options.cursor;
    if (options.limit) params.limit = options.limit;
    if (options.search) params.search = options.search;

    return this.request({
      method: 'GET',
      url: `${this.baseUrl}/chats`,
      headers: this.getHeaders(deviceId),
      // params
    });
  }

  /**
   * Get chat messages
   * GET /chat/:chat_jid/messages
   * Query: cursor (optional), limit (optional), with_media (optional)
   */
  async getChatMessages(chatJid, deviceId = null, options = {}) {
    const params = {};
    if (options.cursor) params.cursor = options.cursor;
    if (options.limit) params.limit = options.limit;
    if (options.with_media !== undefined) params.with_media = options.with_media;

    return this.request({
      method: 'GET',
      url: `${this.baseUrl}/chat/${chatJid}/messages`,
      headers: this.getHeaders(deviceId),
      params
    });
  }

  /**
   * Pin chat
   * POST /chat/:chat_jid/pin
   * Body: pin (true/false)
   */
  async pinChat(chatJid, pin = true, deviceId = null) {
    const data = new formData();
    data.append('pin', pin ? 'true' : 'false');

    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/chat/${encodeURIComponent(chatJid)}/pin`,
      headers: {
        ...data.getHeaders(),
        ...this.getHeaders(deviceId)
      },
      data
    });
  }

  /**
   * Archive chat
   * POST /chat/:chat_jid/archive
   * Body: archive (true/false)
   */
  async archiveChat(chatJid, archive = true, deviceId = null) {
    const data = new formData();
    data.append('archive', archive ? 'true' : 'false');

    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/chat/${encodeURIComponent(chatJid)}/archive`,
      headers: {
        ...data.getHeaders(),
        ...this.getHeaders(deviceId)
      },
      data
    });
  }

  /**
   * Set disappearing messages
   * POST /chat/:chat_jid/disappearing
   * Body: duration (in seconds: 86400 for 1 day, 604800 for 1 week, 7776000 for 30 days)
   */
  async setDisappearingMessages(chatJid, duration, deviceId = null) {
    const data = new formData();
    data.append('duration', duration.toString());

    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/chat/${encodeURIComponent(chatJid)}/disappearing`,
      headers: {
        ...data.getHeaders(),
        ...this.getHeaders(deviceId)
      },
      data
    });
  }

  // ==================== GROUP MANAGEMENT ====================

  /**
   * Get group info
   * GET /group/info
   * Query: group_jid
   */
  async getGroupInfo(groupJid, deviceId = null) {
    return this.request({
      method: 'GET',
      url: `${this.baseUrl}/group/info`,
      headers: this.getHeaders(deviceId),
      params: { group_jid: groupJid }
    });
  }

  /**
   * Get group info from invite link
   * GET /group/info-from-link
   * Query: link
   */
  async getGroupInfoFromLink(link, deviceId = null) {
    return this.request({
      method: 'GET',
      url: `${this.baseUrl}/group/info-from-link`,
      headers: this.getHeaders(deviceId),
      params: { link }
    });
  }

  /**
   * Create group
   * POST /group
   * Body: group_name, phones (comma-separated)
   */
  async createGroup(groupName, participantPhones, deviceId = null) {
    const data = new formData();
    data.append('group_name', groupName);
    data.append('phones', Array.isArray(participantPhones) ? participantPhones.join(',') : participantPhones);

    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/group`,
      headers: {
        ...data.getHeaders(),
        ...this.getHeaders(deviceId)
      },
      data
    });
  }

  /**
   * Leave group
   * POST /group/leave
   * Body: group_jid
   */
  async leaveGroup(groupJid, deviceId = null) {
    const data = new formData();
    data.append('group_jid', groupJid);

    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/group/leave`,
      headers: {
        ...data.getHeaders(),
        ...this.getHeaders(deviceId)
      },
      data
    });
  }

  /**
   * Get group participants
   * GET /group/participants
   * Query: group_jid
   */
  async getGroupParticipants(groupJid, deviceId = null) {
    return this.request({
      method: 'GET',
      url: `${this.baseUrl}/group/participants`,
      headers: this.getHeaders(deviceId),
      params: { group_jid: groupJid }
    });
  }

  /**
   * Add participants to group
   * POST /group/participants
   * Body: group_jid, phones (comma-separated)
   */
  async addGroupParticipants(groupJid, participantPhones, deviceId = null) {
    const data = new formData();
    data.append('group_jid', groupJid);
    data.append('phones', Array.isArray(participantPhones) ? participantPhones.join(',') : participantPhones);

    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/group/participants`,
      headers: {
        ...data.getHeaders(),
        ...this.getHeaders(deviceId)
      },
      data
    });
  }

  /**
   * Remove participant from group
   * POST /group/participants/remove
   * Body: group_jid, phone
   */
  async removeGroupParticipant(groupJid, phone, deviceId = null) {
    const data = new formData();
    data.append('group_jid', groupJid);
    data.append('phone', phone);

    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/group/participants/remove`,
      headers: {
        ...data.getHeaders(),
        ...this.getHeaders(deviceId)
      },
      data
    });
  }

  /**
   * Promote participant to admin
   * POST /group/participants/promote
   * Body: group_jid, phones (comma-separated)
   */
  async promoteGroupParticipant(groupJid, participantPhones, deviceId = null) {
    const data = new formData();
    data.append('group_jid', groupJid);
    data.append('phones', Array.isArray(participantPhones) ? participantPhones.join(',') : participantPhones);

    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/group/participants/promote`,
      headers: {
        ...data.getHeaders(),
        ...this.getHeaders(deviceId)
      },
      data
    });
  }

  /**
   * Demote participant from admin
   * POST /group/participants/demote
   * Body: group_jid, phones (comma-separated)
   */
  async demoteGroupParticipant(groupJid, participantPhones, deviceId = null) {
    const data = new formData();
    data.append('group_jid', groupJid);
    data.append('phones', Array.isArray(participantPhones) ? participantPhones.join(',') : participantPhones);

    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/group/participants/demote`,
      headers: {
        ...data.getHeaders(),
        ...this.getHeaders(deviceId)
      },
      data
    });
  }

  /**
   * Get group invite link
   * GET /group/invite-link
   * Query: group_jid
   */
  async getGroupInviteLink(groupJid, deviceId = null) {
    return this.request({
      method: 'GET',
      url: `${this.baseUrl}/group/invite-link`,
      headers: this.getHeaders(deviceId),
      params: { group_jid: groupJid }
    });
  }

  /**
   * Join group with invite link
   * POST /group/join-with-link
   * Body: link
   */
  async joinGroupWithLink(link, deviceId = null) {
    const data = new formData();
    data.append('link', link);

    return this.request({
      method: 'POST',
      url: `${this.baseUrl}/group/join-with-link`,
      headers: {
        ...data.getHeaders(),
        ...this.getHeaders(deviceId)
      },
      data
    });
  }

  // ==================== USER INFO ====================

  /**
   * Get user info
   * GET /user/info
   * Query: phone (optional, without @s.whatsapp.net)
   */
  async getUserInfo(phone = null, deviceId = null) {
    const params = {};
    if (phone) params.phone = phone;

    return this.request({
      method: 'GET',
      url: `${this.baseUrl}/user/info`,
      headers: this.getHeaders(deviceId),
      params
    });
  }

  /**
   * Get user avatar
   * GET /user/avatar
   * Query: phone (optional)
   */
  async getUserAvatar(phone = null, deviceId = null) {
    const params = {};
    if (phone) params.phone = phone;

    return this.request({
      method: 'GET',
      url: `${this.baseUrl}/user/avatar`,
      headers: this.getHeaders(deviceId),
      params,
      responseType: 'arraybuffer'
    });
  }

  /**
   * Get user's contacts
   * GET /user/my/contacts
   */
  async getMyContacts(deviceId = null) {
    return this.request({
      method: 'GET',
      url: `${this.baseUrl}/user/my/contacts`,
      headers: this.getHeaders(deviceId)
    });
  }

  /**
   * Get user's groups
   * GET /user/my/groups
   */
  async getMyGroups(deviceId = null) {
    return this.request({
      method: 'GET',
      url: `${this.baseUrl}/user/my/groups`,
      headers: this.getHeaders(deviceId)
    });
  }

  /**
   * Check if phone number is on WhatsApp
   * GET /user/check
   * Query: phones (comma-separated)
   */
  async checkUser(phones, deviceId = null) {
    return this.request({
      method: 'GET',
      url: `${this.baseUrl}/user/check`,
      headers: this.getHeaders(deviceId),
      params: {
        phones: Array.isArray(phones) ? phones.join(',') : phones
      }
    });
  }
}

module.exports = new WhatsappService();
