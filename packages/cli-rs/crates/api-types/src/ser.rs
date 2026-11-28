//! Serde helpers the generated types use to write numbers as `JSON.stringify` does.

use serde::Serializer;

/// A protocol number that is not an integer schema: a whole value is written as `3`, not `3.0`, so
/// request bodies match the TypeScript client byte for byte.
pub fn number<S: Serializer>(value: &f64, serializer: S) -> Result<S::Ok, S::Error> {
    // `fract` is NaN for non-finite values, which serde_json writes as `null`, as JavaScript does.
    if value.fract() == 0.0 && value.abs() < 9_223_372_036_854_775_808.0 {
        return serializer.serialize_i64(*value as i64);
    }
    serializer.serialize_f64(*value)
}

pub fn option_number<S: Serializer>(value: &Option<f64>, serializer: S) -> Result<S::Ok, S::Error> {
    match value {
        Some(value) => number(value, serializer),
        None => serializer.serialize_none(),
    }
}

/// Writes a present optional field as either null or a number. Serde skips the absent outer option.
pub fn double_option_number<S: Serializer>(value: &Option<Option<f64>>, serializer: S) -> Result<S::Ok, S::Error> {
    option_number(&value.flatten(), serializer)
}

#[cfg(test)]
mod tests {
    use crate::types::CustomProviderAdvancedCostPatch;

    #[test]
    fn cost_patch_preserves_omitted_null_and_numeric_fields() {
        for (json, expected) in [
            ("{}", None),
            (r#"{"cacheRead":null}"#, Some(None)),
            (r#"{"cacheRead":3}"#, Some(Some(3.0))),
            (r#"{"cacheRead":3.5}"#, Some(Some(3.5))),
        ] {
            let patch: CustomProviderAdvancedCostPatch = serde_json::from_str(json).unwrap();
            assert_eq!(patch.cache_read, expected);
            assert_eq!(serde_json::to_string(&patch).unwrap(), json);
        }
    }
}
