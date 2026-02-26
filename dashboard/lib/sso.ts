/**
 * Enterprise SSO Service
 * Supports SAML 2.0 and OIDC/OAuth2
 */

import { prisma } from './prisma.js';
import { logger } from './logger.js';

export interface SSOConfig {
  id: string;
  provider: 'saml' | 'oidc' | 'oauth';
  providerName: string;
  enabled: boolean;
  autoProvision: boolean;
  defaultRole: string;
  samlEntryPoint?: string;
  samlIssuer?: string;
  samlCert?: string;
  oidcIssuer?: string;
  oidcClientId?: string;
}

export interface SSOUser {
  email: string;
  name?: string;
  ssoId: string;
  ssoProvider: string;
  organizationId?: string;
}

class SSOService {
  private configs: Map<string, SSOConfig> = new Map();

  /**
   * Load SSO configuration for organization
   */
  async loadConfig(organizationId: string): Promise<SSOConfig | null> {
    const config = await prisma.sSOConfig.findFirst({
      where: {
        organizationId,
        enabled: true
      }
    });

    if (!config) {
      return null;
    }

    const ssoConfig: SSOConfig = {
      id: config.id,
      provider: config.provider as any,
      providerName: config.providerName,
      enabled: config.enabled,
      autoProvision: config.autoProvision,
      defaultRole: config.defaultRole,
      samlEntryPoint: config.samlEntryPoint || undefined,
      samlIssuer: config.samlIssuer || undefined,
      samlCert: config.samlCert || undefined,
      oidcIssuer: config.oidcIssuer || undefined,
      oidcClientId: config.oidcClientId || undefined
    };

    this.configs.set(organizationId, ssoConfig);
    return ssoConfig;
  }

  /**
   * Get SSO configuration
   */
  getConfig(organizationId: string): SSOConfig | null {
    return this.configs.get(organizationId) || null;
  }

  /**
   * Generate SAML request
   */
  async generateSAMLRequest(organizationId: string): Promise<{ request: string; id: string } | null> {
    const config = await this.loadConfig(organizationId);
    
    if (!config || config.provider !== 'saml' || !config.samlEntryPoint) {
      return null;
    }

    const id = `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const samlRequest = `
      <samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                          xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                          ID="${id}"
                          Version="2.0"
                          IssueInstant="${now}"
                          Destination="${config.samlEntryPoint}"
                          ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                          AssertionConsumerServiceIndex="0">
        <saml:Issuer>${config.samlIssuer}</saml:Issuer>
        <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"/>
      </samlp:AuthnRequest>
    `;

    return {
      request: Buffer.from(samlRequest).toString('base64'),
      id
    };
  }

  /**
   * Process SAML response
   */
  async processSAMLResponse(organizationId: string, samlResponse: string): Promise<SSOUser | null> {
    const config = await this.loadConfig(organizationId);
    
    if (!config || config.provider !== 'saml') {
      return null;
    }

    try {
      // Decode SAML response
      const decoded = Buffer.from(samlResponse, 'base64').toString('utf-8');
      
      // Extract user information from SAML assertion
      const emailMatch = decoded.match(/<saml:Attribute Name="email">.*?<saml:AttributeValue>(.*?)<\/saml:AttributeValue>/);
      const nameMatch = decoded.match(/<saml:Attribute Name="name">.*?<saml:AttributeValue>(.*?)<\/saml:AttributeValue>/);
      const subjectMatch = decoded.match(/<saml:NameID[^>]*>(.*?)<\/saml:NameID>/);

      if (!emailMatch && !subjectMatch) {
        logger.error('[SSO] No email found in SAML response');
        return null;
      }

      const email = emailMatch?.[1] || subjectMatch?.[1];
      const name = nameMatch?.[1];
      const ssoId = subjectMatch?.[1] || email;

      // Create or update user
      const user = await this.provisionUser({
        email: email!,
        name: name || undefined,
        ssoId: ssoId!,
        ssoProvider: 'saml',
        organizationId
      });

      return user;
    } catch (error: any) {
      logger.error('[SSO] Failed to process SAML response', { error: error.message });
      return null;
    }
  }

  /**
   * Generate OIDC authorization URL
   */
  async generateOIDCAuthUrl(organizationId: string, redirectUri: string): Promise<string | null> {
    const config = await this.loadConfig(organizationId);
    
    if (!config || config.provider !== 'oidc' || !config.oidcIssuer || !config.oidcClientId) {
      return null;
    }

    const state = `org_${organizationId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Store state for validation
    await this.storeState(state, { organizationId, redirectUri });

    const params = new URLSearchParams({
      client_id: config.oidcClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state
    });

    return `${config.oidcIssuer}/authorize?${params.toString()}`;
  }

  /**
   * Process OIDC callback
   */
  async processOIDCCallback(organizationId: string, code: string, state: string): Promise<SSOUser | null> {
    const config = await this.loadConfig(organizationId);
    
    if (!config || config.provider !== 'oidc') {
      return null;
    }

    try {
      // Validate state
      const stateData = await this.getState(state);
      if (!stateData || stateData.organizationId !== organizationId) {
        logger.error('[SSO] Invalid state parameter');
        return null;
      }

      // Exchange code for tokens
      const tokenResponse = await fetch(`${config.oidcIssuer}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: stateData.redirectUri,
          client_id: config.oidcClientId!,
          client_secret: config.oidcSecret!
        })
      });

      const tokens = await tokenResponse.json();

      // Get user info
      const userInfoResponse = await fetch(`${config.oidcIssuer}/userinfo`, {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      });

      const userInfo = await userInfoResponse.json();

      // Create or update user
      const user = await this.provisionUser({
        email: userInfo.email,
        name: userInfo.name,
        ssoId: userInfo.sub,
        ssoProvider: 'oidc',
        organizationId
      });

      return user;
    } catch (error: any) {
      logger.error('[SSO] Failed to process OIDC callback', { error: error.message });
      return null;
    }
  }

  /**
   * Provision user from SSO
   */
  private async provisionUser(ssoUser: SSOUser): Promise<SSOUser> {
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: ssoUser.email }
    });

    if (user) {
      // Update existing user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ssoProvider: ssoUser.ssoProvider,
          ssoId: ssoUser.ssoId,
          lastLoginAt: new Date(),
          emailVerified: true
        }
      });

      logger.info('[SSO] Updated existing user', { email: ssoUser.email });
    } else {
      // Create new user (auto-provisioning)
      const config = this.configs.get(ssoUser.organizationId || '');
      
      await prisma.user.create({
        data: {
          email: ssoUser.email,
          name: ssoUser.name,
          ssoProvider: ssoUser.ssoProvider,
          ssoId: ssoUser.ssoId,
          role: config?.defaultRole || 'VIEWER',
          emailVerified: true,
          active: true,
          organizationId: ssoUser.organizationId
        }
      });

      logger.info('[SSO] Auto-provisioned new user', { email: ssoUser.email });
    }

    return ssoUser;
  }

  /**
   * Store state for OIDC
   */
  private async storeState(state: string, data: any): Promise<void> {
    // Store in Redis with 10 minute expiry
    // For now, using in-memory (replace with Redis in production)
    (global as any).__sso_states = (global as any).__sso_states || new Map();
    (global as any).__sso_states.set(state, { ...data, expires: Date.now() + 10 * 60 * 1000 });
  }

  /**
   * Get and validate state
   */
  private async getState(state: string): Promise<any | null> {
    (global as any).__sso_states = (global as any).__sso_states || new Map();
    const data = (global as any).__sso_states.get(state);
    
    if (!data || data.expires < Date.now()) {
      return null;
    }

    (global as any).__sso_states.delete(state);
    return data;
  }

  /**
   * Test SSO configuration
   */
  async testConnection(organizationId: string): Promise<{ success: boolean; error?: string }> {
    const config = await this.loadConfig(organizationId);
    
    if (!config) {
      return { success: false, error: 'SSO not configured' };
    }

    try {
      if (config.provider === 'saml') {
        // Test SAML metadata endpoint
        if (!config.samlEntryPoint) {
          return { success: false, error: 'SAML entry point not configured' };
        }
        
        const response = await fetch(config.samlEntryPoint, { method: 'HEAD' });
        if (!response.ok) {
          return { success: false, error: 'SAML entry point not accessible' };
        }
      } else if (config.provider === 'oidc') {
        // Test OIDC discovery
        if (!config.oidcIssuer) {
          return { success: false, error: 'OIDC issuer not configured' };
        }

        const response = await fetch(`${config.oidcIssuer}/.well-known/openid-configuration`);
        if (!response.ok) {
          return { success: false, error: 'OIDC discovery endpoint not accessible' };
        }
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// Singleton instance
const ssoService = new SSOService();

export default ssoService;
export { SSOService };
