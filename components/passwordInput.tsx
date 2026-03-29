import { Eye, EyeOff } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    StyleProp,
    StyleSheet,
    TextInput,
    TextInputProps,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { Colors } from '../constants/Colors';

export interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
    leadingIcon?: React.ReactNode;
    containerStyle?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<TextStyle>;
}

export function PasswordInput({
    leadingIcon,
    containerStyle,
    inputStyle,
    style,
    ...rest
}: PasswordInputProps) {
    const [visible, setVisible] = useState(false);

    return (
        <View style={[styles.row, containerStyle]}>
            {leadingIcon}
            <TextInput
                {...rest}
                style={[styles.input, inputStyle, style]}
                secureTextEntry={!visible}
                autoCapitalize={rest.autoCapitalize ?? 'none'}
            />
            <TouchableOpacity
                onPress={() => setVisible((v) => !v)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel={visible ? 'Hide password' : 'Show password'}
                style={styles.toggle}
            >
                {visible ? (
                    <EyeOff color={Colors.dark.textSecondary} size={22} />
                ) : (
                    <Eye color={Colors.dark.textSecondary} size={22} />
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        minWidth: 0,
    },
    toggle: {
        marginLeft: 8,
    },
});
