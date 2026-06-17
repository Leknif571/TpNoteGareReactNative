import { useThemeColor } from "@/hooks/use-theme-color";
import { StyleSheet, TextInput, useColorScheme, View } from "react-native";
import { ThemedText } from "./themed-text";

export type CustomInputProps = {
    label: string,
    value?: string,
    onChangeText: (text: string) => void
}

export default function CustomInput({ label, value = "", onChangeText }: CustomInputProps) {
    const themeName = useColorScheme();
    const borderInputColor = useThemeColor({}, 'borderInput');
    
    const textColor = useThemeColor({}, 'text');

    return (
        <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>{label}</ThemedText>
            <TextInput
                style={[
                    styles.input,
                    { color: textColor }, 
                    themeName === 'light'
                        ? { backgroundColor: '#eeeeee' }
                        : { borderColor: borderInputColor, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
                ]}
                value={value} 
                onChangeText={onChangeText} 
            />
        </View>
    );
}

const styles = StyleSheet.create({
    inputContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        width: '100%',
        gap: 6
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        opacity: 0.8,
    },
    input: {
        borderRadius: 10,
        width: '100%',
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
    }
});