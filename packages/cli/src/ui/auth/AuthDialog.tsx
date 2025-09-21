/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { useCallback } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { RadioButtonSelect } from '../components/shared/RadioButtonSelect.js';
import type { LoadedSettings } from '../../config/settings.js';
import { SettingScope } from '../../config/settings.js';
import { AuthType, clearCachedCredentialFile } from '@google/gemini-cli-core';
import { useKeypress } from '../hooks/useKeypress.js';
import { AuthState } from '../types.js';
// import { runExitCleanup } from '../../utils/cleanup.js'; // Commented for OpenAgent fork
import { validateAuthMethodWithSettings } from './useAuth.js';

interface AuthDialogProps {
  settings: LoadedSettings;
  setAuthState: (state: AuthState) => void;
  authError: string | null;
  onAuthError: (error: string) => void;
}

export function AuthDialog({
  settings,
  setAuthState,
  authError,
  onAuthError,
}: AuthDialogProps): React.JSX.Element {
  let items = [
    // Commented out Google login options for OpenAgent fork
    // {
    //   label: 'Login with Google',
    //   value: AuthType.LOGIN_WITH_GOOGLE,
    // },
    // ...(process.env['CLOUD_SHELL'] === 'true'
    //   ? [
    //       {
    //         label: 'Use Cloud Shell user credentials',
    //         value: AuthType.CLOUD_SHELL,
    //       },
    //     ]
    //   : []),
    // {
    //   label: 'Use Gemini API Key',
    //   value: AuthType.USE_GEMINI,
    // },
    // { label: 'Vertex AI', value: AuthType.USE_VERTEX_AI },
    { label: 'OpenRouter', value: AuthType.USE_OPENROUTER },
  ];

  if (settings.merged.security?.auth?.enforcedType) {
    items = items.filter(
      (item) => item.value === settings.merged.security?.auth?.enforcedType,
    );
  }

  let defaultAuthType = null;
  const defaultAuthTypeEnv = process.env['GEMINI_DEFAULT_AUTH_TYPE'];
  if (
    defaultAuthTypeEnv &&
    Object.values(AuthType).includes(defaultAuthTypeEnv as AuthType)
  ) {
    defaultAuthType = defaultAuthTypeEnv as AuthType;
  }

  let initialAuthIndex = items.findIndex((item) => {
    if (settings.merged.security?.auth?.selectedType) {
      return item.value === settings.merged.security.auth.selectedType;
    }

    if (defaultAuthType) {
      return item.value === defaultAuthType;
    }

    // For OpenAgent, always default to OpenRouter
    return item.value === AuthType.USE_OPENROUTER;
  });

  // Ensure initialAuthIndex is valid (not -1)
  if (initialAuthIndex === -1) {
    initialAuthIndex = 0;
  }

  if (settings.merged.security?.auth?.enforcedType) {
    initialAuthIndex = 0;
  }

  const onSelect = useCallback(
    async (authType: AuthType | undefined, scope: SettingScope) => {
      if (authType) {
        await clearCachedCredentialFile();

        settings.setValue(scope, 'security.auth.selectedType', authType);
        // Commented out Google login handling for OpenAgent fork
        // if (
        //   authType === AuthType.LOGIN_WITH_GOOGLE &&
        //   config.isBrowserLaunchSuppressed()
        // ) {
        //   runExitCleanup();
        //   console.log(
        //     `
        // ----------------------------------------------------------------
        // Logging in with Google... Please restart Gemini CLI to continue.
        // ----------------------------------------------------------------
        //             `,
        //   );
        //   process.exit(0);
        // }
      }
      setAuthState(AuthState.Unauthenticated);
    },
    [settings, setAuthState],
  );

  const handleAuthSelect = (authMethod: AuthType) => {
    const error = validateAuthMethodWithSettings(authMethod, settings);
    if (error) {
      onAuthError(error);
    } else {
      onSelect(authMethod, SettingScope.User);
    }
  };

  useKeypress(
    (key) => {
      if (key.name === 'escape') {
        // Prevent exit if there is an error message.
        // This means they user is not authenticated yet.
        if (authError) {
          return;
        }
        if (settings.merged.security?.auth?.selectedType === undefined) {
          // Prevent exiting if no auth method is set
          onAuthError(
            'You must select an auth method to proceed. Press Ctrl+C twice to exit.',
          );
          return;
        }
        onSelect(undefined, SettingScope.User);
      }
    },
    { isActive: true },
  );

  return (
    <Box
      borderStyle="round"
      borderColor={theme.border.default}
      flexDirection="column"
      padding={1}
      width="100%"
    >
      <Text bold color={theme.text.primary}>
        Get started
      </Text>
      <Box marginTop={1}>
        <Text color={theme.text.primary}>
          How would you like to authenticate for this project?
        </Text>
      </Box>
      <Box marginTop={1}>
        <RadioButtonSelect
          items={items}
          initialIndex={initialAuthIndex}
          onSelect={handleAuthSelect}
        />
      </Box>
      {authError && (
        <Box marginTop={1}>
          <Text color={theme.status.error}>{authError}</Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text color={theme.text.secondary}>(Use Enter to select)</Text>
      </Box>
      <Box marginTop={1}>
        <Text color={theme.text.primary}>
          Terms of Services and Privacy Notice
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text color={theme.text.link}>
          {
            'https://github.com/joshbickett/openagent/blob/main/docs/tos-privacy.md'
          }
        </Text>
      </Box>
    </Box>
  );
}
